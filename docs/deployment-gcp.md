# Deploying the API to Google Cloud Run

The backend runs on Cloud Run in `asia-south1` (Mumbai), sized to stay inside the free tier. Mumbai is priced as Tier 2, so the free allowance may cover fewer hours than in us-central1; check the Cloud Run pricing page and your billing reports.

| Item | Value |
| :--- | :--- |
| Project | `reviewlens-ai-20349` |
| Service | `reviewlens-api` |
| URL | https://reviewlens-api-858498622871.asia-south1.run.app |
| Image repo | `asia-south1-docker.pkg.dev/reviewlens-ai-20349/reviewlens/api` |
| Running image | tag = the commit SHA it was built from (`gcloud run services describe reviewlens-api --region asia-south1 --format='value(spec.template.spec.containers[0].image)'`) |
| Resources | 1 vCPU, 2Gi, concurrency 4, timeout 120 s, min instances 0, max instances 2 |
| Access | Public (`--allow-unauthenticated`) |

Measured with the production image capped at 1 CPU: peak memory 920 MiB, cold `/health` about 5 s on Cloud Run, first transformer request 7.7 s, warm transformer `/predict` 0.2 to 0.3 s, transformer `/batch` about 0.3 s per row (50 rows in 15 s, measured from India). In us-central1 the free tier at 2Gi is 50 instance-hours a month (33 at 3Gi, 25 at 4Gi); Tier 2 regions get less.

## Files

- `deploy/cloudrun/Dockerfile`: Python 3.12, CPU-only torch, `requirements-local.txt` plus `requirements-transformer.txt`, NLTK data in `/usr/local/share/nltk_data` (made world-readable, the app runs as a non-root user), one uvicorn worker.
- `backend/.dockerignore`: leaves out the venv, tests, notebooks, `experiments/results`, and the training data. The transformer in `backend/models/transformer-200k` is gitignored, so it is copied from your machine and must exist before you build.
- `backend/Dockerfile` (Railway) is untouched.

## Environment variables

| Variable | Value |
| :--- | :--- |
| `TRANSFORMER_MODEL` | `/app/models/transformer-200k` |
| `TRANSFORMER_DEVICE` | `cpu` |
| `ALLOW_ORIGINS` | `https://reviewlens-chi.vercel.app` (exact origins, comma-separated) |
| `HF_HUB_OFFLINE`, `TRANSFORMERS_OFFLINE` | `1` |
| `TRANSFORMER_MAX_BATCH_ROWS` | `100` (a 100-row transformer batch takes about 60 s; the default 500 would exceed the timeout) |

Frontend: set `NEXT_PUBLIC_API_URL` to the service URL and redeploy it.

## First-time setup (already done)

```bash
gcloud projects create reviewlens-ai-20349
gcloud billing projects link reviewlens-ai-20349 --billing-account=<BILLING_ACCOUNT_ID>
gcloud config set project reviewlens-ai-20349
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create reviewlens --repository-format=docker --location=asia-south1
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

## Build, push, deploy (also how to redeploy)

Build from an up-to-date `main` with a clean working tree and tag the image with the commit SHA, so the running image can be traced to a commit. The transformer folder `backend/models/transformer-200k` is gitignored and must be present locally.

```bash
IMG=asia-south1-docker.pkg.dev/reviewlens-ai-20349/reviewlens/api:$(git rev-parse --short HEAD)
docker build -f deploy/cloudrun/Dockerfile -t $IMG backend
docker push $IMG

gcloud run deploy reviewlens-api --region asia-south1 --image $IMG \
  --cpu 1 --memory 2Gi --min-instances 0 --max-instances 2 --concurrency 4 \
  --timeout 120 --port 8080 --cpu-boost --allow-unauthenticated \
  --set-env-vars TRANSFORMER_MODEL=/app/models/transformer-200k,TRANSFORMER_DEVICE=cpu,ALLOW_ORIGINS=https://reviewlens-chi.vercel.app,HF_HUB_OFFLINE=1,TRANSFORMERS_OFFLINE=1,TRANSFORMER_MAX_BATCH_ROWS=100
```

To change only the CORS origins: `gcloud run services update reviewlens-api --region asia-south1 --update-env-vars '^@^ALLOW_ORIGINS=https://a.example,https://b.example'` (the `^@^` makes `@` the separator so the comma is kept).

## Verify

```bash
U=https://reviewlens-api-858498622871.asia-south1.run.app
curl $U/health
curl $U/models        # lr, nb, transformer (calibrated, temperature about 1.481)
curl -X POST $U/predict -H 'content-type: application/json' -d '{"review":"Great battery","model":"transformer"}'
curl -H "Origin: https://reviewlens-chi.vercel.app" -I $U/models   # access-control-allow-origin
gcloud run services logs read reviewlens-api --region asia-south1 --limit 50
```

## Cost control

- `--max-instances 2` is the real cap on spend. Budgets only send alerts and do not stop anything.
- The service is public, so anyone can call it. CORS only restricts browsers. If traffic gets abusive, remove public access: `gcloud run services remove-iam-policy-binding reviewlens-api --region asia-south1 --member=allUsers --role=roles/run.invoker`.
- Budget alert: `reviewlens-100inr` (₹100, about $1.10, on this project only; the billing account is in INR, so USD budgets are rejected) emails billing admins at 50%, 90% and 100%. List it with `gcloud billing budgets list --billing-account=<BILLING_ACCOUNT_ID>`.
- Check usage: Cloud Console > Billing > Reports (filter by project), and Cloud Run > reviewlens-api > Metrics (instance time, request count).
- Artifact Registry holds about 0.8 GB per image tag; the first 0.5 GB a month is free. Delete old tags: `gcloud artifacts docker images delete <IMG> --delete-tags`.

## Tear down

```bash
gcloud run services delete reviewlens-api --region asia-south1
gcloud artifacts repositories delete reviewlens --location asia-south1
# optional: remove everything, including the billing link
gcloud projects delete reviewlens-ai-20349
```

## Known risks

- Cold starts: with min instances 0, the first request after idle takes about 8 s while the transformer loads.
- The transformer at 1 vCPU is slow for batches; use `model=lr` for large CSVs.
- Concurrency 4 on one vCPU means simultaneous transformer requests slow each other down.

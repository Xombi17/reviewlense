"""Fine-tune a pretrained transformer for binary sentiment classification.

Plain PyTorch loop on top of ``transformers``: AdamW, linear warmup/decay, mixed precision
on CUDA, and best-epoch selection on the validation split. The model is reduced to the
same log-odds interface as the classical baselines (``logit[1] - logit[0]``).
"""

import random
import time
from dataclasses import asdict, dataclass
from typing import Dict, List, Optional, Sequence

import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

from .metrics import negative_log_likelihood, predict_labels


@dataclass
class FinetuneConfig:
    model_name: str = "distilroberta-base"
    max_length: int = 256
    batch_size: int = 32
    eval_batch_size: int = 128
    learning_rate: float = 2e-5
    epochs: int = 2
    warmup_ratio: float = 0.06
    weight_decay: float = 0.01
    max_grad_norm: float = 1.0
    seed: int = 42
    max_train_samples: Optional[int] = None
    device: Optional[str] = None
    log_every: int = 100


class _EncodedDataset(Dataset):
    def __init__(self, encodings: Dict[str, List[List[int]]], labels: Optional[np.ndarray]):
        self.input_ids = encodings["input_ids"]
        self.attention_mask = encodings["attention_mask"]
        self.labels = labels

    def __len__(self) -> int:
        return len(self.input_ids)

    def __getitem__(self, index: int) -> Dict[str, object]:
        item = {
            "input_ids": self.input_ids[index],
            "attention_mask": self.attention_mask[index],
        }
        if self.labels is not None:
            item["labels"] = int(self.labels[index])
        return item


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def resolve_device(requested: Optional[str] = None) -> torch.device:
    if requested:
        return torch.device(requested)
    if torch.cuda.is_available():
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def _encode(tokenizer, texts: Sequence[str], max_length: int) -> Dict[str, List[List[int]]]:
    return tokenizer(list(texts), truncation=True, max_length=max_length)


def _make_collate(tokenizer):
    def collate(items: List[Dict[str, object]]) -> Dict[str, torch.Tensor]:
        labels = [item.pop("labels") for item in items] if "labels" in items[0] else None
        batch = tokenizer.pad(items, return_tensors="pt")
        if labels is not None:
            batch["labels"] = torch.tensor(labels, dtype=torch.long)
        return batch

    return collate


@torch.inference_mode()
def predict_logits(model, tokenizer, texts: Sequence[str], cfg: FinetuneConfig, device) -> np.ndarray:
    """Log-odds of the positive class for each text, in the input order."""
    encodings = _encode(tokenizer, texts, cfg.max_length)
    # Sort by length so batches pad as little as possible, then restore the order.
    order = np.argsort([len(ids) for ids in encodings["input_ids"]], kind="stable")
    sorted_encodings = {key: [values[i] for i in order] for key, values in encodings.items()}
    loader = DataLoader(
        _EncodedDataset(sorted_encodings, labels=None),
        batch_size=cfg.eval_batch_size,
        shuffle=False,
        collate_fn=_make_collate(tokenizer),
    )

    model.eval()
    chunks = []
    for batch in loader:
        batch = {key: value.to(device) for key, value in batch.items()}
        logits = model(**batch).logits.float()
        chunks.append((logits[:, 1] - logits[:, 0]).cpu().numpy())
    sorted_logits = np.concatenate(chunks).astype(np.float64)

    restored = np.empty_like(sorted_logits)
    restored[order] = sorted_logits
    return restored


def _optimizer(model, cfg: FinetuneConfig) -> torch.optim.Optimizer:
    no_decay = ("bias", "norm")
    decayed, undecayed = [], []
    for name, parameter in model.named_parameters():
        if not parameter.requires_grad:
            continue
        (undecayed if any(token in name.lower() for token in no_decay) else decayed).append(parameter)
    return torch.optim.AdamW(
        [
            {"params": decayed, "weight_decay": cfg.weight_decay},
            {"params": undecayed, "weight_decay": 0.0},
        ],
        lr=cfg.learning_rate,
    )


def finetune(
    train_text: Sequence[str],
    y_train: np.ndarray,
    val_text: Sequence[str],
    y_val: np.ndarray,
    test_text: Sequence[str],
    cfg: FinetuneConfig,
    model=None,
    tokenizer=None,
) -> Dict[str, object]:
    """Fine-tune, keep the best epoch by validation accuracy, return val/test log-odds.

    ``model`` and ``tokenizer`` can be injected (used by tests and offline smoke runs);
    otherwise they are loaded from ``cfg.model_name`` (hub id or local directory).
    """
    set_seed(cfg.seed)
    device = resolve_device(cfg.device)

    if tokenizer is None:
        tokenizer = AutoTokenizer.from_pretrained(cfg.model_name)
    if model is None:
        model = AutoModelForSequenceClassification.from_pretrained(cfg.model_name, num_labels=2)
    model.to(device)

    train_text = list(train_text)
    y_train = np.asarray(y_train)
    if cfg.max_train_samples and cfg.max_train_samples < len(train_text):
        keep = np.random.default_rng(cfg.seed).permutation(len(train_text))[: cfg.max_train_samples]
        train_text = [train_text[i] for i in keep]
        y_train = y_train[keep]

    generator = torch.Generator().manual_seed(cfg.seed)
    train_loader = DataLoader(
        _EncodedDataset(_encode(tokenizer, train_text, cfg.max_length), y_train),
        batch_size=cfg.batch_size,
        shuffle=True,
        generator=generator,
        collate_fn=_make_collate(tokenizer),
    )

    optimizer = _optimizer(model, cfg)
    total_steps = cfg.epochs * len(train_loader)
    scheduler = get_linear_schedule_with_warmup(
        optimizer, int(cfg.warmup_ratio * total_steps), total_steps
    )

    on_cuda = device.type == "cuda"
    amp_dtype = torch.bfloat16 if on_cuda and torch.cuda.is_bf16_supported() else torch.float16
    scaler = torch.amp.GradScaler("cuda", enabled=on_cuda and amp_dtype == torch.float16)

    history: List[Dict[str, float]] = []
    best_state, best_accuracy, best_epoch = None, -1.0, -1
    train_started = time.time()

    for epoch in range(1, cfg.epochs + 1):
        model.train()
        epoch_started = time.time()
        running_loss, seen = 0.0, 0
        for step, batch in enumerate(train_loader, start=1):
            batch = {key: value.to(device) for key, value in batch.items()}
            optimizer.zero_grad(set_to_none=True)
            with torch.autocast(device_type=device.type, dtype=amp_dtype, enabled=on_cuda):
                loss = model(**batch).loss
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), cfg.max_grad_norm)
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()

            running_loss += loss.item() * len(batch["labels"])
            seen += len(batch["labels"])
            if cfg.log_every and step % cfg.log_every == 0:
                print(f"  epoch {epoch} step {step}/{len(train_loader)} loss {running_loss / seen:.4f}")

        val_logits = predict_logits(model, tokenizer, val_text, cfg, device)
        val_accuracy = float(np.mean(predict_labels(val_logits) == y_val))
        history.append(
            {
                "epoch": epoch,
                "train_loss": running_loss / max(seen, 1),
                "val_accuracy": val_accuracy,
                "val_nll": negative_log_likelihood(y_val, val_logits),
                "seconds": time.time() - epoch_started,
            }
        )
        print(f"epoch {epoch}: {history[-1]}")
        if val_accuracy > best_accuracy:
            best_accuracy, best_epoch = val_accuracy, epoch
            best_state = {key: value.detach().cpu().clone() for key, value in model.state_dict().items()}

    train_seconds = time.time() - train_started
    model.load_state_dict(best_state)

    best_val_logits = predict_logits(model, tokenizer, val_text, cfg, device)
    inference_started = time.time()
    test_logits = predict_logits(model, tokenizer, test_text, cfg, device)
    inference_seconds = time.time() - inference_started

    return {
        "val_logits": best_val_logits,
        "test_logits": test_logits,
        "config": {
            **asdict(cfg),
            "device": str(device),
            "best_epoch": best_epoch,
            "n_parameters": int(sum(p.numel() for p in model.parameters())),
            "n_train_used": len(train_text),
        },
        "history": history,
        "train_seconds": train_seconds,
        "inference_seconds": inference_seconds,
    }

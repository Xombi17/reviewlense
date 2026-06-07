import os
import tarfile
import csv
import io
from preprocessing import clean_review_text, is_valid_review

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAR_PATH = os.path.join(os.path.dirname(BASE_DIR), "amazon_review_polarity_csv.tgz")
OUTPUT_PATH = os.path.join(BASE_DIR, "data", "processed_reviews.csv")

def extract_and_balance():
    print(f"Opening archive: {TAR_PATH}")
    if not os.path.exists(TAR_PATH):
        raise FileNotFoundError(f"Tarball not found at {TAR_PATH}")

    pos_target = 10000
    neg_target = 10000
    
    pos_list = []
    neg_list = []
    
    # Open tarfile and find train.csv
    with tarfile.open(TAR_PATH, "r:gz") as tar:
        train_member = tar.getmember("amazon_review_polarity_csv/train.csv")
        f = tar.extractfile(train_member)
        if f is None:
            raise RuntimeError("Could not extract train.csv from archive")
        
        # Read as text stream
        text_stream = io.TextIOWrapper(f, encoding="utf-8")
        reader = csv.reader(text_stream)
        
        print("Reading reviews and balancing classes (target: 10,000 each)...")
        count = 0
        for row in reader:
            if len(row) < 3:
                continue
            
            label_idx = row[0]
            title = row[1]
            text = row[2]
            
            full_text = f"{title} {text}".strip()
            
            # Label mapping: class 1 -> 0 (neg), class 2 -> 1 (pos)
            if label_idx == '1':
                if len(neg_list) >= neg_target:
                    continue
                cleaned = clean_review_text(full_text)
                if is_valid_review(full_text, cleaned):
                    neg_list.append((cleaned, 0))
            elif label_idx == '2':
                if len(pos_list) >= pos_target:
                    continue
                cleaned = clean_review_text(full_text)
                if is_valid_review(full_text, cleaned):
                    pos_list.append((cleaned, 1))
            
            # Print progress periodically
            count += 1
            if count % 10000 == 0:
                print(f"Scanned {count} rows... Neg: {len(neg_list)}/{neg_target}, Pos: {len(pos_list)}/{pos_target}")
                
            if len(neg_list) >= neg_target and len(pos_list) >= pos_target:
                break
                
    print(f"Extraction complete. Total collected: {len(neg_list) + len(pos_list)}")
    
    # Save to CSV
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as out_f:
        writer = csv.writer(out_f)
        writer.writerow(["clean_text", "label"])
        for cleaned, label in neg_list + pos_list:
            writer.writerow([cleaned, label])
            
    print(f"Saved balanced dataset to: {OUTPUT_PATH}")

if __name__ == "__main__":
    extract_and_balance()

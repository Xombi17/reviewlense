import os
import csv
import sys
from preprocessing import clean_review_text, is_valid_review

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AMAZON_TRAIN_PATH = os.path.join(BASE_DIR, "data", "raw", "amazon_train.csv")
AMAZON_TEST_PATH = os.path.join(BASE_DIR, "data", "raw", "amazon_test.csv")

OUTPUT_TRAIN_PATH = os.path.join(BASE_DIR, "data", "processed_train_reviews.csv")
OUTPUT_TEST_PATH = os.path.join(BASE_DIR, "data", "processed_test_reviews.csv")

def print_progress_bar(iteration, total, prefix='', suffix='', decimals=1, length=40, fill='█', print_end="\r"):
    percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + '░' * (length - filled_length)
    sys.stdout.write(f'\r{prefix} |{bar}| {percent}% {suffix}')
    sys.stdout.flush()
    if iteration == total:
        sys.stdout.write(print_end)
        sys.stdout.flush()

def process_file(input_path, output_path, target_pos, target_neg):
    corpus = []
    pos_needed = target_pos
    neg_needed = target_neg
    total_target = target_pos + target_neg
    
    if not os.path.exists(input_path):
        print(f" ⚠️  CSV not found at {input_path}. Skipping.")
        return 0
        
    file_size = os.path.getsize(input_path)
    bytes_read = 0
    
    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        collected = 0
        for row in reader:
            row_len = sum(len(cell) for cell in row) + len(row) + 1
            bytes_read += row_len
            
            if len(row) < 3:
                continue
                
            label_idx = row[0]
            full_text = f"{row[1]} {row[2]}".strip()
            
            matched = False
            if label_idx == '1' and neg_needed > 0:
                cleaned = clean_review_text(full_text)
                if is_valid_review(full_text, cleaned):
                    corpus.append((cleaned, 0))
                    neg_needed -= 1
                    matched = True
            elif label_idx == '2' and pos_needed > 0:
                cleaned = clean_review_text(full_text)
                if is_valid_review(full_text, cleaned):
                    corpus.append((cleaned, 1))
                    pos_needed -= 1
                    matched = True
                    
            if matched:
                collected = total_target - (pos_needed + neg_needed)
                print_progress_bar(
                    min(bytes_read, file_size),
                    file_size,
                    prefix=' Progress',
                    suffix=f'({collected}/{total_target})',
                    length=30
                )
                
            if pos_needed == 0 and neg_needed == 0:
                break
                
    sys.stdout.write("\n")
    
    # Save to output CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as out_f:
        writer = csv.writer(out_f)
        writer.writerow(["clean_text", "label"])
        for cleaned, label in corpus:
            writer.writerow([cleaned, label])
            
    return len(corpus)

def build_dataset():
    print("\n" + "="*60)
    print(" 🛠️  ReviewLens AI - Train/Test Dataset Builder")
    print("="*60 + "\n")

    # Compile Train dataset (1,000,000 total = 500K pos + 500K neg)
    print(f" 📦 Compiling Train Dataset (1M reviews) from: {AMAZON_TRAIN_PATH}")
    train_count = process_file(AMAZON_TRAIN_PATH, OUTPUT_TRAIN_PATH, 500000, 500000)

    # Compile Test dataset (400K total = 200K pos + 200K neg, uses full test set)
    print(f"\n 📦 Compiling Test Dataset (400K reviews) from: {AMAZON_TEST_PATH}")
    test_count = process_file(AMAZON_TEST_PATH, OUTPUT_TEST_PATH, 200000, 200000)

    print("\n" + "="*60)
    print(" 🎉 Compilation Successful!")
    print("="*60)
    print(f" 📂 Train Data: {OUTPUT_TRAIN_PATH} ({train_count:,} reviews)")
    print(f" 📂 Test Data:  {OUTPUT_TEST_PATH} ({test_count:,} reviews)")
    print("="*60 + "\n")

if __name__ == "__main__":
    build_dataset()

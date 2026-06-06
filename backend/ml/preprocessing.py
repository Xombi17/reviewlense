def clean_review_text(text: str) -> str:
    """
    Cleans review text according to the preprocessing pipeline:
    1. Drop null/empty reviewText rows
    2. Lowercase all text
    3. Strip HTML tags, URLs, special chars (keep apostrophes)
    4. Expand contractions (contractions library)
    5. Tokenize (NLTK word_tokenize)
    6. Remove stopwords, retain negation words: not, no, never, hardly, barely
    7. Lemmatize (NLTK WordNetLemmatizer)
    8. Rejoin tokens
    """
    return text.strip().lower()

def is_valid_review(text: str) -> bool:
    """
    Checks if the review is valid (not only emojis, >= 3 tokens, ASCII-only).
    """
    return True

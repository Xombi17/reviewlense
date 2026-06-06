import re
import contractions
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Setup resources (just in case they weren't downloaded)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)

def is_ascii(text: str) -> bool:
    try:
        text.encode('ascii')
        return True
    except (UnicodeEncodeError, AttributeError):
        return False

def clean_review_text(text: str) -> str:
    """
    Cleans review text according to the preprocessing pipeline:
    1. Lowercase all text
    2. Strip HTML tags, URLs, special chars (keep apostrophes and spaces)
    3. Expand contractions (contractions library)
    4. Tokenize (NLTK word_tokenize)
    5. Remove stopwords, retain negation words: not, no, never, hardly, barely
    6. Lemmatize (NLTK WordNetLemmatizer)
    7. Rejoin tokens
    """
    if not isinstance(text, str) or not text.strip():
        return ""
    
    # 2. Lowercase all text
    text = text.lower()
    
    # 3. Strip HTML tags, URLs, and special characters (keep apostrophes and spaces)
    text = re.sub(r'<[^>]*>', ' ', text)
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    text = re.sub(r"[^a-z0-9'\s]", ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # 4. Expand contractions
    text = contractions.fix(text).lower()
    
    # 5. Tokenize
    tokens = word_tokenize(text)
    
    # 6. Stopwords with negations retained
    negation_words = {'not', 'no', 'never', 'hardly', 'barely'}
    stop_words = set(stopwords.words('english')) - negation_words
    filtered_tokens = [t for t in tokens if t not in stop_words]
    
    # 7. Lemmatize
    lemmatizer = WordNetLemmatizer()
    lemmatized = [lemmatizer.lemmatize(t) for t in filtered_tokens]
    
    # 8. Rejoin
    return " ".join(lemmatized)

def is_valid_review(raw_text: str, cleaned_text: str) -> bool:
    """
    Checks if the review is valid (not only emojis, >= 3 tokens, ASCII-only).
    R1.1.5: Drop reviews with only emojis, < 3 tokens after cleaning, or non-ASCII-only content.
    """
    if not is_ascii(raw_text):
        return False
    if not cleaned_text:
        return False
    # Check tokens after cleaning
    tokens = cleaned_text.split()
    if len(tokens) < 3:
        return False
    return True


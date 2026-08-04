import re

from app.services.preprocessing.normalization import normalize_text
from app.services.preprocessing.tokenizer import tokenize

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has",
    "in", "is", "it", "near", "of", "on", "or", "that", "the", "to", "with",
    "after", "before", "into", "across", "this", "there", "been", "being",
}

def clean_text(text: str) -> str:
    text = normalize_text(text)
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"@\w+|#\w+", " ", text)
    text = re.sub(r"[^\w\s,-]", " ", text, flags=re.UNICODE)
    words = [word for word in tokenize(text) if word not in STOP_WORDS]
    return " ".join(words)

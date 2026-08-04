from functools import lru_cache

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from app.core.config import get_settings


@lru_cache
def _sentence_model():
    settings = get_settings()
    if not settings.enable_ai_models:
        return None
    try:
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer(settings.embedding_model)
    except Exception:
        return None


def generate_embeddings(texts: list[str]) -> np.ndarray:
    model = _sentence_model()
    if model:
        return np.array(model.encode(texts, normalize_embeddings=True))
    vectorizer = TfidfVectorizer(max_features=256, ngram_range=(1, 2))
    return vectorizer.fit_transform(texts).toarray()

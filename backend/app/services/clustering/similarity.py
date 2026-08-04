import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def similarity_matrix(embeddings: np.ndarray) -> list[list[float]]:
    return cosine_similarity(embeddings).round(3).tolist()

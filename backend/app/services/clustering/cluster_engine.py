from collections import defaultdict

from sklearn.cluster import DBSCAN, KMeans

from app.services.clustering.embedding_generator import generate_embeddings
from app.services.summarization.t5_summarizer import summarize_events


def cluster_texts(texts: list[str], algorithm: str = "dbscan") -> dict:
    if not texts:
        return {"clusters": []}
    if len(texts) == 1:
        return {"clusters": [{"cluster_id": "cluster-0", "label": 0, "texts": texts, "summary": summarize_events(texts)}]}

    embeddings = generate_embeddings(texts)
    if algorithm.lower() == "kmeans":
        count = min(4, max(2, len(texts) // 2))
        labels = KMeans(n_clusters=count, n_init=10, random_state=7).fit_predict(embeddings)
    else:
        labels = DBSCAN(eps=0.72, min_samples=1, metric="cosine").fit_predict(embeddings)

    groups: dict[int, list[str]] = defaultdict(list)
    for label, text in zip(labels, texts):
        groups[int(label)].append(text)

    return {
        "clusters": [
            {
                "cluster_id": f"cluster-{label}",
                "label": label,
                "texts": group,
                "summary": summarize_events(group),
                "size": len(group),
            }
            for label, group in sorted(groups.items())
        ]
    }

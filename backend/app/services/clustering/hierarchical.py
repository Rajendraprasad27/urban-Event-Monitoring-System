import math
from collections import defaultdict
from datetime import datetime

import numpy as np
from sklearn.cluster import DBSCAN

from app.services.classification.labels import EVENT_LABELS
from app.services.clustering.embedding_generator import generate_embeddings
from app.services.summarization.t5_summarizer import summarize_events

NEIGHBORHOODS = [
    {"name": "Indiranagar", "lat": 12.9719, "lng": 77.6412},
    {"name": "Koramangala", "lat": 12.9279, "lng": 77.6271},
    {"name": "Whitefield", "lat": 12.9698, "lng": 77.7499},
    {"name": "Jayanagar", "lat": 12.9308, "lng": 77.5838},
    {"name": "HSR Layout", "lat": 12.9101, "lng": 77.6450},
    {"name": "MG Road", "lat": 12.9740, "lng": 77.6077},
]

CATEGORY_PRIORITY = [
    "Emergency", "Accident", "Fire", "Flood", "Traffic",
    "Public Gathering", "Crime", "Infrastructure", "Health",
    "Political Event", "Protest", "Transport Disruption", "Utility Failure", "Weather", "Other"
]

SEMANTIC_WEIGHT = 0.5
CATEGORY_WEIGHT = 0.3
LOCATION_WEIGHT = 0.2


def get_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def find_nearest_neighborhood(latitude: float, longitude: float) -> str:
    if latitude is None or longitude is None:
        return "Bengaluru"
    closest = min(NEIGHBORHOODS, key=lambda n: get_distance(latitude, longitude, n["lat"], n["lng"]))
    return closest["name"]


def normalize_location(event: dict, neighborhood: str | None = None) -> str:
    if event.get("locations"):
        first_location = event["locations"][0]
        if first_location:
            return first_location
    if event.get("latitude") is not None and event.get("longitude") is not None:
        return find_nearest_neighborhood(event["latitude"], event["longitude"])
    if neighborhood:
        return neighborhood
    return "Bengaluru"


def calculate_severity(events: list[dict]) -> str:
    scores = {"low": 1, "medium": 2, "high": 3}
    total = 0
    for event in events:
        total += scores.get(event.get("severity", "low"), 1)
    avg = total / max(len(events), 1)
    high_count = sum(1 for event in events if event.get("severity") == "high")
    if high_count >= max(2, len(events) // 3) or avg >= 2.5:
        return "Critical"
    if avg >= 2.0:
        return "High"
    if avg >= 1.3:
        return "Medium"
    return "Low"


def summarize_cluster_events(events: list[dict]) -> str:
    texts = [event.get("raw_text", "") for event in events if event.get("raw_text")]
    if not texts:
        return "No summary available."
    return summarize_events(texts)


def location_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return 1.0 if a.lower() == b.lower() else 0.0


def category_similarity(a: str, b: str) -> float:
    return 1.0 if (a or "").lower() == (b or "").lower() else 0.0


def cluster_category_events(location_name: str, category: str, events: list[dict], location_lat: float, location_lng: float) -> list[dict]:
    texts = [event.get("raw_text", "") for event in events]
    labels = [0] * len(texts)
    embeddings = None
    if len(texts) > 1:
        try:
            embeddings = generate_embeddings(texts)
            labels = DBSCAN(eps=0.72, min_samples=1, metric="cosine").fit_predict(embeddings).tolist()
        except Exception:
            labels = [0] * len(texts)

    clusters_by_label: dict[int, list[dict]] = defaultdict(list)
    for label, event in zip(labels, events):
        clusters_by_label[int(label)].append(event)

    subclusters: list[dict] = []
    for label, cluster_events in sorted(clusters_by_label.items(), key=lambda item: len(item[1]), reverse=True):
        report_count = len(cluster_events)
        summary = summarize_cluster_events(cluster_events)
        sources = sorted({event.get("source", "unknown") for event in cluster_events})
        affected_areas = sorted({loc for event in cluster_events for loc in event.get("locations", []) if loc})
        centroid = None
        if embeddings is not None:
            label_indices = [idx for idx, lab in enumerate(labels) if int(lab) == int(label)]
            if label_indices:
                centroid = np.mean(embeddings[label_indices], axis=0).round(6).tolist()

        last_updated = max(
            (event.get("created_at") for event in cluster_events if event.get("created_at")),
            default=None,
        )
        if isinstance(last_updated, datetime):
            last_updated = last_updated.isoformat()

        location_lat = next((event["latitude"] for event in cluster_events if event.get("latitude") is not None), location_lat)
        location_lng = next((event["longitude"] for event in cluster_events if event.get("longitude") is not None), location_lng)

        subclusters.append({
            "id": f"{location_name.lower().replace(' ', '-')}-{category.lower().replace(' ', '-')}-{label}",
            "parentClusterId": f"location-{location_name.lower().replace(' ', '-')}",
            "parentLocation": location_name,
            "location": location_name,
            "city": "Bengaluru",
            "category": category,
            "severity": calculate_severity(cluster_events),
            "summary": summary,
            "raw_summary": summary,
            "reportCount": report_count,
            "size": report_count,
            "sources": sources,
            "affectedAreas": affected_areas,
            "lastUpdated": last_updated or "Unknown",
            "embeddingCentroid": centroid,
            "latitude": location_lat,
            "longitude": location_lng,
            "events": cluster_events,
        })
    return subclusters


def build_hierarchical_clusters(events: list[dict], neighborhood: str | None = None) -> list[dict]:
    if not events:
        return []

    grouped_by_location: dict[str, list[dict]] = defaultdict(list)
    for event in events:
        location_key = normalize_location(event, neighborhood)
        grouped_by_location[location_key].append(event)

    hierarchical_clusters: list[dict] = []
    for location_name, location_events in sorted(grouped_by_location.items(), key=lambda item: len(item[1]), reverse=True):
        category_groups: dict[str, list[dict]] = defaultdict(list)
        for event in location_events:
            category = event.get("category") if event.get("category") in EVENT_LABELS else "Other"
            category_groups[category].append(event)

        valid_coords = [(event.get("latitude"), event.get("longitude")) for event in location_events if event.get("latitude") is not None and event.get("longitude") is not None]
        if valid_coords:
            avg_lat = sum(coord[0] for coord in valid_coords) / len(valid_coords)
            avg_lng = sum(coord[1] for coord in valid_coords) / len(valid_coords)
        else:
            avg_lat = NEIGHBORHOODS[0]["lat"]
            avg_lng = NEIGHBORHOODS[0]["lng"]

        subclusters: list[dict] = []
        for category, category_events in sorted(category_groups.items(), key=lambda item: (-len(item[1]), CATEGORY_PRIORITY.index(item[0]) if item[0] in CATEGORY_PRIORITY else len(CATEGORY_PRIORITY))):
            subclusters.extend(cluster_category_events(location_name, category, category_events, avg_lat, avg_lng))

        hierarchical_clusters.append({
            "id": f"location-{location_name.lower().replace(' ', '-')}",
            "location": location_name,
            "city": "Bengaluru",
            "totalReports": len(location_events),
            "latitude": avg_lat,
            "longitude": avg_lng,
            "subClusters": sorted(subclusters, key=lambda item: item["reportCount"], reverse=True),
        })

    return hierarchical_clusters

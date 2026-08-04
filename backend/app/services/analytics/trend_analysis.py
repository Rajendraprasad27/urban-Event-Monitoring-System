from collections import Counter


def trending_events(events: list[dict]) -> list[dict]:
    clusters = Counter(event.get("cluster_id") or event.get("category") for event in events)
    return [
        {"name": name, "mentions": mentions, "velocity": min(100, 40 + mentions * 12)}
        for name, mentions in clusters.most_common(8)
    ]

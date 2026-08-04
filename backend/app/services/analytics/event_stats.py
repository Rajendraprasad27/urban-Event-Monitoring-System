from collections import Counter


def build_distribution(events: list[dict], key: str) -> list[dict]:
    counts = Counter(event.get(key, "Unknown") for event in events)
    return [{"name": name, "value": value} for name, value in counts.items()]


def active_heat_zones(events: list[dict]) -> int:
    return len({location for event in events for location in event.get("locations", []) if event.get("severity") == "high"})

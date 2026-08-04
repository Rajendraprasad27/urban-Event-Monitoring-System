from typing import Any

PARENT_CLUSTER_COLLECTION = "parent_clusters"
SUB_CLUSTER_COLLECTION = "sub_clusters"

def get_parent_cluster_schema(location: str, city: str = "Bengaluru") -> dict[str, Any]:
    return {
        "_id": f"location-{location.lower().replace(' ', '-')}",
        "location": location,
        "city": city,
        "total_reports": 0,
        "created_at": None,
        "last_updated": None
    }

def get_sub_cluster_schema(parent_id: str, category: str, initial_summary: str = "") -> dict[str, Any]:
    import uuid
    sub_id = f"{parent_id}-{category.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}"
    return {
        "_id": sub_id,
        "parent_id": parent_id,
        "category": category,
        "report_count": 0,
        "summary": initial_summary,
        "severity": "Low",
        "confidence": 0.0,
        "sources": [],
        "affected_areas": [],
        "created_at": None,
        "last_updated": None,
        "last_summary_count": 0  # To track when to regenerate summary
    }

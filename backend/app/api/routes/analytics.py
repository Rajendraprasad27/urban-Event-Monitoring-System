import math
from collections import Counter, defaultdict
from fastapi import APIRouter

from app.core.database import get_database, serialize_doc
from app.services.analytics.event_stats import active_heat_zones, build_distribution
from app.services.analytics.trend_analysis import trending_events
from app.services.clustering.hierarchical import build_hierarchical_clusters, NEIGHBORHOODS
from app.services.summarization.t5_summarizer import summarize_events

router = APIRouter()

def get_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Haversine distance in km
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.get("/")
async def get_analytics():
    rows = await get_database().events.find({}).sort("created_at", -1).limit(200).to_list(200)
    events = [serialize_doc(row) for row in rows]
    avg_confidence = round(sum(event.get("confidence", 0) for event in events) / max(len(events), 1) * 100, 1)
    return {
        "active_events": len(events),
        "citizen_reports": len([event for event in events if event.get("source") in {"manual", "social", "sample"}]),
        "high_heat_zones": active_heat_zones(events),
        "ai_confidence": avg_confidence,
        "category_distribution": build_distribution(events, "category"),
        "severity_distribution": build_distribution(events, "severity"),
        "trends": trending_events(events),
    }

@router.get("/trends")
async def get_trends():
    rows = await get_database().events.find({}).sort("created_at", -1).limit(200).to_list(200)
    return {"trends": trending_events([serialize_doc(row) for row in rows])}

@router.get("/trending")
async def get_trending_news(neighborhood: str | None = None):
    from app.models.cluster_model import PARENT_CLUSTER_COLLECTION, SUB_CLUSTER_COLLECTION
    db = get_database()
    
    parent_query = {}
    if neighborhood:
        parent_query["location"] = {"$regex": f"^{neighborhood}$", "$options": "i"}

    parent_rows = await db[PARENT_CLUSTER_COLLECTION].find(parent_query).to_list(100)
    parents = [serialize_doc(row) for row in parent_rows]

    for p in parents:
        sub_rows = await db[SUB_CLUSTER_COLLECTION].find({"parent_id": p["id"]}).to_list(100)
        subs = [serialize_doc(row) for row in sub_rows]
        
        for sc in subs:
            # Add events to each sub-cluster
            events = await db.events.find({"sub_cluster_id": sc["id"]}).sort("created_at", -1).to_list(100)
            sc["events"] = [serialize_doc(e) for e in events]
            sc["reportCount"] = sc.get("report_count", 0)
            sc["lastUpdated"] = sc.get("last_updated")
            sc["affectedAreas"] = sc.get("affected_areas", [])
            
        p["subClusters"] = subs
        p["totalReports"] = p.get("total_reports", 0)

    # We also return a flat list of trends for the map markers
    flat_trends = []
    for p in parents:
        for sc in p["subClusters"]:
            if sc["events"]:
                ev = sc["events"][0]
                flat_trends.append({
                    "id": sc["id"],
                    "category": sc["category"],
                    "location": ", ".join(sc["affectedAreas"]) if sc.get("affectedAreas") else p["location"],
                    "size": sc["reportCount"],
                    "latitude": ev.get("latitude"),
                    "longitude": ev.get("longitude"),
                    "raw_summary": sc.get("summary")
                })

    return {
        "locations": parents,
        "trends": flat_trends,
    }

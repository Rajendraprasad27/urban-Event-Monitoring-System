import datetime
from typing import Any
import numpy as np

from app.core.database import get_database, serialize_doc, utc_now
from app.models.cluster_model import PARENT_CLUSTER_COLLECTION, SUB_CLUSTER_COLLECTION, get_parent_cluster_schema, get_sub_cluster_schema
from app.services.summarization.t5_summarizer import generate_subcluster_summary


async def find_or_create_subcluster(event_doc: dict[str, Any]) -> str:
    db = get_database()
    location = event_doc.get("primary_location", "Bengaluru")
    if not location:
        location = "Bengaluru"
    category = event_doc.get("category", "General")
    
    # 1. Find or create ParentCluster
    parent_id = f"location-{location.lower().replace(' ', '-')}"
    parent_cluster = await db[PARENT_CLUSTER_COLLECTION].find_one({"_id": parent_id})
    if not parent_cluster:
        parent_cluster = get_parent_cluster_schema(location)
        parent_cluster["created_at"] = utc_now()
        await db[PARENT_CLUSTER_COLLECTION].insert_one(parent_cluster)
        
    # 2. Find matching SubCluster inside Parent
    sub_clusters = await db[SUB_CLUSTER_COLLECTION].find({"parent_id": parent_id}).to_list(100)
    
    best_match = None
    for sc in sub_clusters:
        # Group strictly by category for subclusters as requested
        if sc.get("category") == category:
            best_match = sc
            break

    if best_match:
        sc_id = best_match["_id"]
    else:
        sc_data = get_sub_cluster_schema(parent_id, category, "")
        sc_data["created_at"] = utc_now()
        await db[SUB_CLUSTER_COLLECTION].insert_one(sc_data)
        sc_id = sc_data["_id"]
        
    return sc_id

async def update_subcluster_summary(sc_id: str):
    db = get_database()
    sc = await db[SUB_CLUSTER_COLLECTION].find_one({"_id": sc_id})
    if not sc:
        return
        
    events_cursor = db.events.find({"sub_cluster_id": sc_id})
    events = await events_cursor.to_list(1000)
    
    # Caching check: only regenerate if the count changed
    if sc.get("last_summary_count") == len(events) and len(events) > 0:
        return
        
    sources = list(set(e.get("source", "Unknown") for e in events if e.get("source")))
    affected_areas = []
    for e in events:
        affected_areas.extend(e.get("locations", []))
    affected_areas = list(set(affected_areas))

    parent = await db[PARENT_CLUSTER_COLLECTION].find_one({"_id": sc["parent_id"]})
    cluster_location = ", ".join(affected_areas) if affected_areas else (parent.get("location", "Bengaluru") if parent else "Bengaluru")
    
    summary_data = generate_subcluster_summary(sc["category"], cluster_location, events)
    
    await db[SUB_CLUSTER_COLLECTION].update_one(
        {"_id": sc_id},
        {
            "$set": {
                "summary": summary_data["summary"],
                "severity": summary_data["severity"],
                "confidence": summary_data["confidence"],
                "report_count": len(events),
                "last_summary_count": len(events),
                "sources": sources,
                "affected_areas": affected_areas,
                "last_updated": utc_now()
            }
        }
    )
    
    if parent:
        all_subs = await db[SUB_CLUSTER_COLLECTION].find({"parent_id": sc["parent_id"]}).to_list(100)
        total = sum(s.get("report_count", 0) for s in all_subs)
        await db[PARENT_CLUSTER_COLLECTION].update_one(
            {"_id": sc["parent_id"]},
            {"$set": {"total_reports": total, "last_updated": utc_now()}}
        )

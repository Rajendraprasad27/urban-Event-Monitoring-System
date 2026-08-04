from app.core.database import get_database
from app.models.cluster_model import PARENT_CLUSTER_COLLECTION
from app.services.clustering.realtime_cluster import find_or_create_subcluster, update_subcluster_summary

async def init_clusters():
    db = get_database()
    parent_count = await db[PARENT_CLUSTER_COLLECTION].count_documents({})
    if parent_count == 0:
        print("Initializing hierarchical clusters and generating AI summaries...")
        events = await db.events.find({}).to_list(1000)
        sub_ids = set()
        for event in events:
            if not event.get("sub_cluster_id"):
                sub_id = await find_or_create_subcluster(event)
                await db.events.update_one({"_id": event["_id"]}, {"$set": {"sub_cluster_id": sub_id}})
                sub_ids.add(sub_id)
                
        for sc_id in sub_ids:
            await update_subcluster_summary(sc_id)
        print("Completed AI Summarization for seeded events.")

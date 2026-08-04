import asyncio
from app.services.ingestion.feed_manager import process_and_store_event
from app.core.database import connect_to_mongo, close_mongo_connection

async def test():
    await connect_to_mongo()
    print("Sending report 1...")
    evt1 = await process_and_store_event("Heavy traffic jam near Silk Board junction due to an accident.", source="twitter", latitude=12.9172, longitude=77.6228)
    
    print("Sending duplicate report 2...")
    # This should be deduplicated by similarity
    evt2 = await process_and_store_event("Major traffic jam near Silk Board because of accident.", source="facebook", latitude=12.9180, longitude=77.6220)
    
    print("Sending unrelated report 3...")
    evt3 = await process_and_store_event("Severe waterlogging and flooding around Silk Board.", source="news", latitude=12.9172, longitude=77.6228)
    
    await close_mongo_connection()
    print("Done")

if __name__ == "__main__":
    asyncio.run(test())

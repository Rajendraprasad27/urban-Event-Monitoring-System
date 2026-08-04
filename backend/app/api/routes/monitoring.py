import random

from fastapi import APIRouter

from app.api.websocket.socket_manager import manager
from app.services.ingestion.feed_manager import process_and_store_event
from app.services.ingestion.news_scraper import SAMPLE_NEWS_ITEMS
from app.services.ingestion.twitter_stream import SAMPLE_SOCIAL_POSTS

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "system": "active"}


@router.post("/simulate")
async def simulate_event():
    text = random.choice(SAMPLE_SOCIAL_POSTS + SAMPLE_NEWS_ITEMS)
    event = await process_and_store_event(text, source="simulated")
    try:
        await manager.broadcast_json({"type": "event.created", "event": event})
    except Exception:
        pass
    return event

from app.core.database import get_database, serialize_doc, utc_now
from app.services.classification.bert_classifier import classify_event, predict_severity
from app.services.extraction.location_parser import infer_coordinates
from app.services.extraction.ner_extractor import extract_entities
from app.services.preprocessing.cleaner import clean_text
from app.services.summarization.t5_summarizer import summarize_events

from datetime import datetime

async def process_and_store_event(text: str, source: str = "manual", latitude: float | None = None, longitude: float | None = None, media_url: str | None = None, timestamp: datetime | str | None = None):
    cleaned_text = clean_text(text)
    classification = classify_event(cleaned_text or text)
    entities = extract_entities(text)
    if latitude is None or longitude is None:
        latitude, longitude = infer_coordinates(entities["locations"])

    primary_location = entities["locations"][0] if entities["locations"] else None
    if not primary_location and latitude is not None and longitude is not None:
        primary_location = "Bengaluru"

    severity = predict_severity(text, classification["category"], classification["confidence"])
    event_type = classification["category"]
    location_key = primary_location or "Bengaluru"

    document = {
        "raw_text": text,
        "cleaned_text": cleaned_text,
        "category": event_type,
        "event_type": event_type,
        "confidence": classification["confidence"],
        "severity": severity,
        "locations": entities["locations"],
        "primary_location": primary_location,
        "entities": entities["entities"],
        "times": entities["times"],
        "latitude": latitude,
        "longitude": longitude,
        "source": source,
        "media_url": media_url,
        "summary": summarize_events([text]),
        "cluster_id": f"{event_type.lower().replace(' ', '-')}-{location_key.lower().replace(' ', '-')}",
        "created_at": timestamp if timestamp else utc_now(),
    }
    result = await get_database().events.insert_one(document)
    document["_id"] = result.inserted_id
    
    from app.services.clustering.realtime_cluster import find_or_create_subcluster, update_subcluster_summary
    sc_id = await find_or_create_subcluster(document)
    await get_database().events.update_one({"_id": document["_id"]}, {"$set": {"sub_cluster_id": sc_id}})
    document["sub_cluster_id"] = sc_id
    
    await update_subcluster_summary(sc_id)
    
    return serialize_doc(document)

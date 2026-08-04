import os
import uuid
import shutil
from bson import ObjectId
from fastapi import APIRouter, Query, UploadFile, File

from app.core.database import get_database, serialize_doc
from app.schemas.event_schema import ClusterRequest, ExtractRequest, ProcessEventRequest, SummarizeRequest
from app.services.classification.bert_classifier import classify_event
from app.services.clustering.cluster_engine import cluster_texts
from app.services.extraction.ner_extractor import extract_entities
from app.services.ingestion.feed_manager import process_and_store_event
from app.services.preprocessing.cleaner import clean_text
from app.services.summarization.t5_summarizer import summarize_events

router = APIRouter()

@router.get("/")
async def get_events(
    category: str | None = None,
    severity: str | None = None,
    search: str | None = None,
    limit: int = Query(default=50, le=200),
):
    query = {}
    if category:
        query["category"] = category
    if severity:
        query["severity"] = severity
    if search:
        query["raw_text"] = {"$regex": search, "$options": "i"}
    rows = await get_database().events.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [serialize_doc(row) for row in rows]

@router.post("/process")
async def process_event(payload: ProcessEventRequest):
    event = await process_and_store_event(payload.text, payload.source, payload.latitude, payload.longitude, payload.media_url, payload.timestamp)
    return {"status": "processed", "data": event}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/uploads/{filename}"}


@router.post("/classify")
def classify(payload: ExtractRequest):
    cleaned = clean_text(payload.text)
    return {"cleaned_text": cleaned, **classify_event(cleaned or payload.text)}


@router.post("/summarize")
def summarize(payload: SummarizeRequest):
    return {"summary": summarize_events(payload.texts)}


@router.post("/cluster")
def cluster(payload: ClusterRequest):
    return cluster_texts(payload.texts, payload.algorithm)


@router.post("/extract")
def extract(payload: ExtractRequest):
    return extract_entities(payload.text)


@router.get("/{event_id}")
async def get_event(event_id: str):
    lookup_id = ObjectId(event_id) if ObjectId.is_valid(event_id) else event_id
    row = await get_database().events.find_one({"_id": lookup_id})
    return serialize_doc(row) if row else {"detail": "Event not found"}

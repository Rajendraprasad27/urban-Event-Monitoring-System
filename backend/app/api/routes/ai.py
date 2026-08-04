from fastapi import APIRouter

from app.schemas.event_schema import ClusterRequest, ExtractRequest, SummarizeRequest
from app.services.classification.bert_classifier import classify_event
from app.services.clustering.cluster_engine import cluster_texts
from app.services.extraction.ner_extractor import extract_entities
from app.services.preprocessing.cleaner import clean_text
from app.services.summarization.t5_summarizer import summarize_events


router = APIRouter()


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

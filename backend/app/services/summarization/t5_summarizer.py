import re
from functools import lru_cache
from typing import Any
import numpy as np

from app.core.config import get_settings


@lru_cache
def _get_embedding_model():
    settings = get_settings()
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer(settings.embedding_model)
    except Exception as e:
        print(f"Failed to load embedding model: {e}")
        return None


@lru_cache
def _summarizer():
    settings = get_settings()
    if not settings.enable_ai_models:
        return None
    try:
        from transformers import pipeline
        # Use flan-t5-small for better instruction following than standard t5-small
        model_name = "google/flan-t5-small"
        return pipeline("text2text-generation", model=model_name)
    except Exception:
        return None


def deduplicate_reports(reports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not reports:
        return []
    
    embedder = _get_embedding_model()
    if not embedder:
        return reports
    
    unique_reports = []
    unique_embeddings = []
    
    for report in reports:
        text = report.get("raw_text", "")
        if not text:
            continue
            
        emb = embedder.encode(text)
        
        is_duplicate = False
        for u_emb in unique_embeddings:
            # Cosine similarity
            sim = np.dot(emb, u_emb) / (np.linalg.norm(emb) * np.linalg.norm(u_emb))
            if sim > 0.85:
                is_duplicate = True
                break
                
        if not is_duplicate:
            unique_reports.append(report)
            unique_embeddings.append(emb)
            
    return unique_reports


def generate_subcluster_summary(category: str, location: str, reports: list[dict[str, Any]]) -> dict[str, Any]:
    # 1. Dedup
    unique_reports = deduplicate_reports(reports)
    
    # 2. Sort by timestamp (newest first)
    unique_reports.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
    
    # Automatic Severity Detection
    count = len(reports)
    severity = "Low"
    if count >= 30:
        severity = "Critical"
    elif count >= 16:
        severity = "High"
    elif count >= 6:
        severity = "Medium"
        
    cat_lower = category.lower()
    if any(x in cat_lower for x in ["fire", "flood", "accident", "emergency"]):
        if severity == "Low": severity = "Medium"
        elif severity == "Medium": severity = "High"
        elif severity == "High": severity = "Critical"

    if not unique_reports:
        return {
            "summary": "No reports available for summarization.",
            "severity": severity,
            "confidence": 0.0
        }

    # Limit to top 10 unique reports for context window
    report_texts = "\n- ".join(r.get("raw_text", "") for r in unique_reports[:10])
    
    prompt = f"""Summarize the following incident reports concisely (under 80 words). Do not repeat verbatim. Identify the main situation, severity, and affected areas.

Location: {location}
Category: {category}
Reports:
- {report_texts}

Summary:"""

    summarizer = _summarizer()
    if summarizer:
        try:
            out = summarizer(prompt, max_length=100, do_sample=False)
            generated_text = out[0]['generated_text']
        except Exception as e:
            print(f"Summarizer error: {e}")
            generated_text = f"Multiple {category} incidents reported near {location}."
    else:
        generated_text = f"Multiple {category} incidents reported near {location}."
        
    # Calculate confidence from the unique reports
    confidences = [r.get("confidence", 0) for r in unique_reports]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.8
        
    return {
        "summary": generated_text.strip(),
        "severity": severity,
        "confidence": round(avg_conf, 2)
    }


def rule_based_summary(texts: list[str]) -> str:
    # Deduplicate
    unique = []
    seen = set()
    for t in texts:
        clean = re.sub(r'\s+', ' ', t.strip())
        if clean and clean.lower() not in seen:
            seen.add(clean.lower())
            unique.append(clean)
            
    if not unique:
        return "No active incident details reported."
        
    cleaned_unique = [t.rstrip('.') for t in unique]
    count = len(texts)
    unique_count = len(cleaned_unique)
    primary_event = cleaned_unique[0]
    
    if unique_count == 1:
        summary = (
            f"A single localized incident was reported. "
            f"The dispatch profile records the following details: {primary_event}. "
            f"Emergency personnel and active monitoring systems have logged this report for real-time tracking and verification."
        )
    else:
        corroboration = " ".join(f"Subsequent feeds state: {t}." for t in cleaned_unique[1:3])
        summary = (
            f"An active incident cluster has been established based on {count} incoming citizen report(s). "
            f"The primary broadcast states: {primary_event}. "
            f"{corroboration} "
            f"The aggregation of these multiple matching reports indicates higher confidence and a need for immediate zone validation."
        )
        
    return summary


def summarize_events(texts: list) -> str:
    if not texts:
        return "No event text available."
        
    # Deduplicate input texts
    unique_texts = []
    seen = set()
    for t in texts:
        clean = t.strip()
        if clean and clean.lower() not in seen:
            seen.add(clean.lower())
            unique_texts.append(clean)
            
    if not unique_texts:
        return "No event text available."
        
    summarizer = _summarizer()
    if not summarizer:
        return rule_based_summary(unique_texts)
        
    combined_text = " ".join(unique_texts)
    input_text = "summarize: " + combined_text
    
    if len(input_text.split()) > 512:
        input_text = " ".join(input_text.split()[:512])
        
    try:
        summary = summarizer(input_text, max_length=100, min_length=20, do_sample=False)
        gen_dict = summary[0]
        gen_text = gen_dict.get('generated_text') or gen_dict.get('summary_text') or ""
        return gen_text.strip()
    except Exception:
        return rule_based_summary(unique_texts)


from functools import lru_cache

from app.core.config import get_settings
from app.services.classification.labels import EVENT_LABELS

CATEGORY_KEYWORDS = {
    "Traffic": ["traffic", "jam", "congestion", "road", "junction", "stalled", "blocked", "slow", "delay", "bus", "metro", "route", "signal"],
    "Accident": ["accident", "crash", "collision", "injured", "hit", "pileup", "wreck", "fatal", "ambulance", "ambulance"],
    "Weather": ["weather", "storm", "rain", "wind", "hail", "temperature", "cloud", "heatwave", "thunder", "lightning"],
    "Flood": ["flood", "waterlogging", "waterlogged", "submerged", "overflow", "drain", "water level", "river"],
    "Fire": ["fire", "smoke", "flames", "burning", "blaze", "wildfire", "sparks", "firefighters"],
    "Public Gathering": ["gathering", "crowd", "protest", "rally", "march", "festival", "demonstration", "assembly", "public event"],
    "Emergency": ["emergency", "evacuation", "rescue", "hazard", "chemical", "gas leak", "collapse", "trapped", "police", "firefighters"],
    "Crime": ["crime", "theft", "robbery", "assault", "shooting", "burglary", "vandalism", "attack", "arson"],
    "Infrastructure": ["bridge", "power outage", "water outage", "shutdown", "construction", "leak", "collapse", "damage", "utility", "network"],
    "Health": ["health", "hospital", "disease", "virus", "medical", "injury", "ambulance", "illness", "infection"],
    "Political Event": ["election", "campaign", "political", "candidate", "vote", "policy", "government", "minister"],
    "Protest": ["protest", "march", "sit-in", "demonstration", "boycott", "strike", "demand"],
    "Transport Disruption": ["delay", "cancellation", "service disruption", "train", "flight", "strike", "road closure", "reroute", "platform"],
    "Utility Failure": ["power outage", "blackout", "water outage", "gas leak", "sewer", "utility failure", "internet down"],
    "Other": ["unknown", "general", "alert", "notice"],
}


@lru_cache
def _pipeline():
    settings = get_settings()
    if not settings.enable_ai_models:
        return None
    try:
        from transformers import pipeline
        from pathlib import Path

        model_path = Path(__file__).resolve().parents[4] / "ml_models" / "bert-event-classifier"
        if model_path.exists():
            return ("text", pipeline("text-classification", model=str(model_path), tokenizer=str(model_path)))
        return ("zero-shot", pipeline("zero-shot-classification", model="facebook/bart-large-mnli"))
    except Exception:
        return None


def _choose_keyword_category(text: str) -> tuple[str, float]:
    lowered = (text or "").lower()
    scores = {
        label: sum(1 for keyword in keywords if keyword in lowered)
        for label, keywords in CATEGORY_KEYWORDS.items()
    }
    label = max(scores, key=scores.get)
    score = scores[label]
    if score == 0:
        if any(word in lowered for word in ["rain", "storm", "flood", "weather", "waterlogging"]):
            label = "Weather"
        elif any(word in lowered for word in ["fire", "smoke", "blaze", "flames"]):
            label = "Fire"
        elif any(word in lowered for word in ["protest", "march", "demonstration", "crowd"]):
            label = "Protest"
        elif any(word in lowered for word in ["accident", "crash", "collision", "injured"]):
            label = "Accident"
        else:
            label = "Other"
    confidence = 0.6 if score == 0 else min(0.98, 0.68 + score * 0.06)
    return label, round(confidence, 3)


def classify_event(text: str) -> dict:
    classifier = _pipeline()
    text = (text or "").strip()
    if classifier and text:
        kind, pipe = classifier
        try:
            if kind == "text":
                result = pipe(text, truncation=True)
                top = result[0]
                category = top.get("label", "Other")
                if category not in EVENT_LABELS:
                    category = "Other"
                return {"category": category, "confidence": round(float(top.get("score", 0.0)), 3)}
            result = pipe(text, candidate_labels=EVENT_LABELS)
            label = result["labels"][0] if result.get("labels") else "Other"
            score = float(result["scores"][0]) if result.get("scores") else 0.0
            return {"category": label if label in EVENT_LABELS else "Other", "confidence": round(score, 3)}
        except Exception:
            pass

    category, confidence = _choose_keyword_category(text)
    return {"category": category, "confidence": confidence}


def predict_severity(text: str, category: str, confidence: float) -> str:
    urgent = ["injured", "fire", "evacuation", "collapse", "fatal", "rescue", "trapped", "severe"]
    medium = ["blocked", "slow", "crowd", "waterlogging", "delay", "police"]
    lowered = (text or "").lower()
    if confidence > 0.9 or any(word in lowered for word in urgent):
        return "high"
    if category in {"Accident", "Emergency"} or any(word in lowered for word in medium):
        return "medium"
    return "low"

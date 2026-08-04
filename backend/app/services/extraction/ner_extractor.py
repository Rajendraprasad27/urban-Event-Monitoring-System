import re
from functools import lru_cache

from app.core.config import get_settings


KNOWN_LOCATIONS = {
    "MG Road": (12.9755, 77.6068),
    "Silk Board": (12.9177, 77.6238),
    "Marathahalli": (12.9569, 77.7011),
    "Koramangala": (12.9352, 77.6245),
    "Whitefield": (12.9698, 77.7499),
    "Indiranagar": (12.9784, 77.6408),
    "Hebbal": (13.0358, 77.5970),
    "Majestic": (12.9767, 77.5713),
    "Outer Ring Road": (12.9569, 77.7011),
    "Kengeri": (12.9176, 77.4838),
}


@lru_cache
def _nlp():
    try:
        import spacy

        return spacy.load(get_settings().spacy_model)
    except Exception:
        return None

def extract_entities(text: str) -> dict:
    nlp = _nlp()
    locations: list[str] = []
    entities: list[dict] = []
    if nlp:
        doc = nlp(text)
        entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
        locations = [ent["text"] for ent in entities if ent["label"] in {"GPE", "LOC", "FAC"}]

    lowered = text.lower()
    for location in KNOWN_LOCATIONS:
        if location.lower() in lowered and location not in locations:
            locations.append(location)

    times = re.findall(r"\b(?:\d{1,2}:\d{2}\s?(?:am|pm)?|\d{1,2}\s?(?:am|pm))\b", text, flags=re.I)
    return {
        "locations": locations,
        "entities": entities,
        "times": times,
    }

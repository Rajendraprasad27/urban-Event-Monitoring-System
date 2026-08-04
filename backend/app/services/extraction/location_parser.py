from app.services.extraction.ner_extractor import KNOWN_LOCATIONS


def infer_coordinates(locations: list[str]) -> tuple[float | None, float | None]:
    for location in locations:
        for known, coords in KNOWN_LOCATIONS.items():
            if known.lower() in location.lower() or location.lower() in known.lower():
                return coords
    return None, None

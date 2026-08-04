import re


TOKEN_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z0-9_-]+")


def tokenize(text: str) -> list[str]:
    return TOKEN_PATTERN.findall((text or "").lower())

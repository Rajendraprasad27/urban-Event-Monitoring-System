# CityMind AI Architecture

CityMind AI is split into a React operations console, a FastAPI NLP service, and MongoDB persistence.

## Flow

1. Text arrives from manual reports, simulated social feeds, or future stream connectors.
2. The backend normalizes and cleans text.
3. Classification predicts Traffic, Flood, Accident, Public Gathering, or Emergency.
4. Entity extraction finds locations, times, and named entities.
5. Location parsing converts known city entities into coordinates.
6. Clustering groups similar reports with sentence embeddings or TF-IDF fallback.
7. Summarization creates concise operator-ready summaries.
8. WebSocket updates push processed events to the dashboard.

## AI Modes

`ENABLE_AI_MODELS=false` keeps the app lightweight and deterministic for local demos. It uses keyword classification, TF-IDF embeddings, and extractive summaries.

`ENABLE_AI_MODELS=true` enables HuggingFace/spaCy model loading for transformer classification, T5 summarization, sentence transformer embeddings, and richer NER.

# Urban Event Monitoring System

Complete full-stack AI-powered urban event monitoring platform using React, FastAPI, MongoDB, NLP, and transformer-ready services.

## What It Does

- Collects urban incident text from manual input, simulated public streams, and future feed connectors.
- Cleans noisy text, classifies events, extracts locations/entities/times, predicts severity, clusters similar posts, and summarizes grouped reports.
- Streams structured events to a dark real-time dashboard with charts, event feed, map markers, reports, and settings.
- Supports JWT authentication and MongoDB persistence, with an in-memory fallback for fast demos.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Framer Motion, Recharts, React Leaflet.
- Backend: FastAPI, WebSockets, MongoDB/Motor, HuggingFace-ready NLP services, spaCy-ready NER, scikit-learn clustering.
- DevOps: Docker, Docker Compose, environment configuration.

## Quick Start

Backend:

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. Register a new analyst account, then use “Simulate live event” or submit reports in Live Monitoring.

## Docker

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`
Backend docs: `http://localhost:8000/docs`

## AI Model Mode

By default, `ENABLE_AI_MODELS=false` uses deterministic local fallbacks so the project runs without downloading large models. Set `ENABLE_AI_MODELS=true` in `backend/.env` to load transformer/spaCy models configured by:

- `CLASSIFIER_MODEL`
- `SUMMARIZER_MODEL`
- `EMBEDDING_MODEL`
- `SPACY_MODEL`

## Training a Classifier

Kaggle downloads require `KAGGLE_USERNAME` and `KAGGLE_KEY`. After configuring them:

```bash
python backend/scripts/download_kaggle_dataset.py --dataset jannesklaas/disasters-on-social-media
python backend/scripts/prepare_training_data.py --raw-dir datasets/raw --include-synthetic
set PYTHONPATH=backend
python backend/scripts/train_event_classifier.py --epochs 3 --batch-size 8
```

The trained DistilBERT model is saved in `ml_models/bert-event-classifier`. More detail is in `docs/model-training.md`.

## Key Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/events/`
- `POST /api/events/process`
- `POST /api/classify`
- `POST /api/summarize`
- `POST /api/cluster`
- `POST /api/extract`
- `GET /api/analytics/`
- `GET /api/analytics/trends`
- `WS /ws/events`



# Setup Guide

## Local Development

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

MongoDB only:

```bash
docker compose up -d mongodb
```

Full stack:

```bash
docker compose up --build
```

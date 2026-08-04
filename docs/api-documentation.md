# API Documentation

Base URL: `http://localhost:8000`

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

## Events and AI

- `GET /api/events/`
- `GET /api/events/{id}`
- `POST /api/events/process`
- `POST /api/classify`
- `POST /api/summarize`
- `POST /api/cluster`
- `POST /api/extract`

## Analytics

- `GET /api/analytics/`
- `GET /api/analytics/trends`

## Live

- `WS /ws/events`
- `POST /api/monitoring/simulate`

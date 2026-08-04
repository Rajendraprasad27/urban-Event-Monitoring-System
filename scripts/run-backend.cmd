@echo off
cd /d D:\Urban-Event-Monitoring-System\backend
..\.venv312\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000

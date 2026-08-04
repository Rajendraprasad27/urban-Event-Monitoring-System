@echo off
REM Start Backend Server
echo.
echo ==========================================
echo Starting Urban Event Monitoring Backend
echo ==========================================
echo.

cd /d d:\Urban-Event-Monitoring-System\backend

REM Activate virtual environment
call ..\.venv312\Scripts\Activate.bat

REM Start FastAPI server
echo.
echo Starting FastAPI on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause

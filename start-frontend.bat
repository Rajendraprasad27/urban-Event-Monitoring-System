@echo off
REM Start Frontend Server
echo.
echo ==========================================
echo Starting Urban Event Monitoring Frontend
echo ==========================================
echo.

cd /d d:\Urban-Event-Monitoring-System\frontend

REM Install dependencies if needed
echo Installing dependencies...
call npm install

REM Start Vite dev server
echo.
echo Starting Frontend on http://localhost:5173
echo Press Ctrl+C to stop the server
echo.
call npm run dev

pause

@echo off
REM Master script to start all services
echo.
echo ==========================================
echo Urban Event Monitoring System
echo Starting all services...
echo ==========================================
echo.

REM Start MongoDB (optional - app has fallback)
echo.
echo [1/3] Starting MongoDB...
echo Opening MongoDB startup script...
start "MongoDB" cmd /k "d:\Urban-Event-Monitoring-System\start-mongodb.bat"
timeout /t 5 /nobreak

REM Start Backend
echo.
echo [2/3] Starting Backend Server...
echo Opening Backend startup script...
start "Backend API" cmd /k "d:\Urban-Event-Monitoring-System\start-backend.bat"
timeout /t 5 /nobreak

REM Start Frontend
echo.
echo [3/3] Starting Frontend Server...
echo Opening Frontend startup script...
start "Frontend" cmd /k "d:\Urban-Event-Monitoring-System\start-frontend.bat"

echo.
echo ==========================================
echo All services starting...
echo ==========================================
echo.
echo Waiting for servers to initialize...
timeout /t 10 /nobreak

echo.
echo Access the application:
echo - Frontend:  http://localhost:5173
echo - API Docs:  http://localhost:8000/docs
echo - Health:    http://localhost:8000/api/monitoring/health
echo.
pause

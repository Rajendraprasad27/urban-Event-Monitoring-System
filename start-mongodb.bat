@echo off
REM Start MongoDB using Docker
echo.
echo ==========================================
echo Starting MongoDB with Docker
echo ==========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if MongoDB container is already running
docker ps | findstr /i "mongo" >nul 2>&1
if not errorlevel 1 (
    echo MongoDB container is already running
    pause
    exit /b 0
)

REM Start MongoDB container
echo Starting MongoDB container...
docker run -d ^
  --name citymind-mongodb ^
  -p 27017:27017 ^
  -e MONGO_INITDB_ROOT_USERNAME=admin ^
  -e MONGO_INITDB_ROOT_PASSWORD=adminpassword ^
  mongo:latest

echo.
echo MongoDB started successfully!
echo Connection: mongodb://admin:adminpassword@localhost:27017
echo.
pause

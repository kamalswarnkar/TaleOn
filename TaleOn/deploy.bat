@echo off
REM TaleOn Deployment Script for Windows
REM This script deploys the TaleOn application using Docker Compose

echo 🚀 Starting TaleOn Deployment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available. Please ensure Docker Desktop is running.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from template...
    if exist "taleon-backend\env.production.template" (
        copy "taleon-backend\env.production.template" ".env"
        echo ✅ .env file created from template. Please edit it with your actual values.
        echo 📝 Required variables:
        echo    - MONGODB_URI
        echo    - JWT_SECRET
        echo    - SESSION_SECRET
        echo    - GROQ_API_KEY
        echo    - FRONTEND_URL
        echo    - EMAIL_USER (optional)
        echo    - EMAIL_PASS (optional)
        echo    - GOOGLE_CLIENT_ID (optional)
        echo    - GOOGLE_CLIENT_SECRET (optional)
        pause
        exit /b 1
    ) else (
        echo ❌ Environment template not found. Please create a .env file manually.
        pause
        exit /b 1
    )
)

echo ✅ Environment file found

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose down --remove-orphans

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up -d --build

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...

REM Check backend health
curl -f http://127.0.0.1:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
    docker-compose logs backend
    pause
    exit /b 1
)

REM Check frontend health
curl -f http://127.0.0.1:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
    docker-compose logs frontend
    pause
    exit /b 1
)

echo 🎉 Deployment completed successfully!
echo.
echo 📱 Application URLs:
echo    Frontend: http://127.0.0.1:3000
echo    Backend API: http://127.0.0.1:5000
echo    MongoDB: 127.0.0.1:27017
echo.
echo 🔧 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    Update services: docker-compose up -d --build
echo.
echo 📊 Monitor health:
echo    Backend: curl http://127.0.0.1:5000/health
echo    Frontend: curl http://127.0.0.1:3000/health
echo.
pause



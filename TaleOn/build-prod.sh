#!/bin/bash

# TaleOn Production Build Script
# This script builds the application for production deployment without Docker

set -e

echo "🔨 Building TaleOn for Production..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Build Backend
echo "🔧 Building Backend..."
cd taleon-backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found in backend. Creating from template..."
    if [ -f "env.production.template" ]; then
        cp env.production.template .env
        echo "✅ .env file created. Please edit it with your actual values."
        echo "📝 Required variables: MONGODB_URI, JWT_SECRET, SESSION_SECRET, GROQ_API_KEY"
        exit 1
    else
        echo "❌ Environment template not found."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm ci --only=production

# Validate environment variables
echo "🔍 Validating environment variables..."
source .env

required_vars=("MONGODB_URI" "JWT_SECRET" "SESSION_SECRET" "GROQ_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables: ${missing_vars[*]}"
    echo "Please update your .env file and try again."
    exit 1
fi

echo "✅ Backend environment validated"

cd ..

# Build Frontend
echo "🎨 Building Frontend..."
cd taleon

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found in frontend. Creating from template..."
    if [ -f "env.production.template" ]; then
        cp env.production.template .env
        echo "✅ .env file created. Please edit it with your actual values."
        echo "📝 Required variables: VITE_API_URL, VITE_SOCKET_URL"
        exit 1
    else
        echo "❌ Environment template not found."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm ci

# Build for production
echo "🏗️  Building frontend for production..."
npm run build:prod

# Validate build output
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed. dist directory not found."
    exit 1
fi

echo "✅ Frontend built successfully"

cd ..

# Create production package
echo "📦 Creating production package..."
PROD_DIR="taleon-production-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$PROD_DIR"

# Copy backend
cp -r taleon-backend "$PROD_DIR/"
rm -rf "$PROD_DIR/taleon-backend/node_modules"
rm -f "$PROD_DIR/taleon-backend/.env"

# Copy frontend build
cp -r taleon/dist "$PROD_DIR/taleon-frontend"

# Copy deployment files
cp docker-compose.yml "$PROD_DIR/"
cp deploy.sh "$PROD_DIR/"
cp deploy.bat "$PROD_DIR/"
cp DEPLOYMENT.md "$PROD_DIR/"

# Copy environment templates
cp taleon-backend/env.production.template "$PROD_DIR/"
cp taleon/env.production.template "$PROD_DIR/"

# Create production start script
cat > "$PROD_DIR/start-prod.sh" << 'EOF'
#!/bin/bash
# Production Start Script

echo "🚀 Starting TaleOn Production..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from env.production.template"
    exit 1
fi

# Start backend
echo "🔧 Starting Backend..."
cd taleon-backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 10

# Check if backend is running
if ! curl -f http://127.0.0.1:5000/health > /dev/null 2>&1; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend started successfully"

# Start frontend (serve static files)
echo "🎨 Starting Frontend..."
cd ../taleon-frontend

# Check if Python 3 is available for simple HTTP server
if command -v python3 &> /dev/null; then
    python3 -m http.server 3000 &
    FRONTEND_PID=$!
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 3000 &
    FRONTEND_PID=$!
else
    echo "⚠️  Python not found. Please install Python to serve frontend files."
    echo "   Or use nginx/apache to serve files from taleon-frontend directory."
    FRONTEND_PID=""
fi

echo "🎉 TaleOn Production Started!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://127.0.0.1:3000"
echo "   Backend API: http://127.0.0.1:5000"
echo ""
echo "🛑 To stop: kill $BACKEND_PID $FRONTEND_PID"

# Wait for interrupt
trap "echo '🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
EOF

chmod +x "$PROD_DIR/start-prod.sh"

# Create Windows start script
cat > "$PROD_DIR/start-prod.bat" << 'EOF'
@echo off
REM Production Start Script for Windows

echo 🚀 Starting TaleOn Production...

REM Check if .env exists
if not exist ".env" (
    echo ❌ .env file not found. Please create it from env.production.template
    pause
    exit /b 1
)

REM Start backend
echo 🔧 Starting Backend...
cd taleon-backend
start "TaleOn Backend" cmd /k "npm start"

REM Wait for backend to start
timeout /t 10 /nobreak >nul

REM Check if backend is running
curl -f http://127.0.0.1:5000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend failed to start
    pause
    exit /b 1
)

echo ✅ Backend started successfully

REM Start frontend (serve static files)
echo 🎨 Starting Frontend...
cd ../taleon-frontend

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% equ 0 (
    start "TaleOn Frontend" cmd /k "python -m http.server 3000"
) else (
    echo ⚠️  Python not found. Please install Python to serve frontend files.
    echo    Or use nginx/apache to serve files from taleon-frontend directory.
)

echo 🎉 TaleOn Production Started!
echo.
echo 📱 Application URLs:
echo    Frontend: http://127.0.0.1:3000
echo    Backend API: http://127.0.0.1:5000
echo.
echo 🛑 To stop: Close the command windows
pause
EOF

echo "✅ Production package created: $PROD_DIR"
echo ""
echo "📦 Package contents:"
echo "   - Backend (without node_modules)"
echo "   - Frontend build (dist)"
echo "   - Docker Compose configuration"
echo "   - Deployment scripts"
echo "   - Environment templates"
echo "   - Production start scripts"
echo ""
echo "🚀 To deploy:"
echo "   1. Copy $PROD_DIR to your production server"
echo "   2. Create .env file from template"
echo "   3. Run ./start-prod.sh (Linux/Mac) or start-prod.bat (Windows)"
echo ""
echo "🐳 For Docker deployment:"
echo "   1. Copy $PROD_DIR to your production server"
echo "   2. Create .env file from template"
echo "   3. Run ./deploy.sh"



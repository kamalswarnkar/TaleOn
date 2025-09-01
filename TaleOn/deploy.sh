#!/bin/bash

# TaleOn Deployment Script
# This script deploys the TaleOn application using Docker Compose

set -e

echo "🚀 Starting TaleOn Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f "taleon-backend/env.production.template" ]; then
        cp taleon-backend/env.production.template .env
        echo "✅ .env file created from template. Please edit it with your actual values."
        echo "📝 Required variables:"
        echo "   - MONGODB_URI"
        echo "   - JWT_SECRET"
        echo "   - SESSION_SECRET"
        echo "   - GROQ_API_KEY"
        echo "   - FRONTEND_URL"
        echo "   - EMAIL_USER (optional)"
        echo "   - EMAIL_PASS (optional)"
        echo "   - GOOGLE_CLIENT_ID (optional)"
        echo "   - GOOGLE_CLIENT_SECRET (optional)"
        exit 1
    else
        echo "❌ Environment template not found. Please create a .env file manually."
        exit 1
    fi
fi

# Load environment variables
source .env

# Validate required environment variables
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

echo "✅ Environment variables validated"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check backend health
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Check MongoDB connection
if docker-compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('MongoDB connected'); process.exit(0); })
  .catch(err => { console.error('MongoDB connection failed:', err); process.exit(1); });
" > /dev/null 2>&1; then
    echo "✅ MongoDB connection successful"
else
    echo "❌ MongoDB connection failed"
    docker-compose logs mongodb
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   MongoDB: localhost:27017"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update services: docker-compose up -d --build"
echo ""
echo "📊 Monitor health:"
echo "   Backend: curl http://localhost:5000/health"
echo "   Frontend: curl http://localhost:3000/health"



#!/bin/bash

echo "🚀 Starting IPTables Web Manager with Docker..."
echo ""

# Create data directory if it doesn't exist
mkdir -p data

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check if backend is ready
echo "🔍 Checking backend health..."
until curl -s http://localhost:8080/api/v1/rules > /dev/null 2>&1; do
  echo "   Waiting for backend..."
  sleep 2
done

echo "✅ Backend is ready!"

# Check if frontend is ready
echo "🔍 Checking frontend health..."
until curl -s http://localhost > /dev/null 2>&1; do
  echo "   Waiting for frontend..."
  sleep 2
done

echo "✅ Frontend is ready!"
echo ""
echo "🎉 IPTables Web Manager is running!"
echo ""
echo "   🌐 Web Interface: http://localhost"
echo "   📡 Backend API:   http://localhost:8080/api/v1"
echo ""
echo "📋 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo ""

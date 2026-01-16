#!/bin/bash

echo "Starting IPTables Web Manager in development mode..."

# Start backend (requires root)
echo "Starting backend server (requires root permissions)..."
cd backend
sudo go run cmd/server/main.go &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Access the application at: http://localhost:3000"
echo "Backend API at: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

wait

#!/bin/bash

echo "Setting up IPTables Web Manager..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
go mod download
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Setup complete!"
echo "To run the application:"
echo "1. Start backend: cd backend && sudo go run cmd/server/main.go"
echo "2. Start frontend: cd frontend && npm start"

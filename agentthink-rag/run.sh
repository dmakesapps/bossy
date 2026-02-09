#!/bin/bash
# Development run script for AgentThink RAG Service
# Starts Qdrant in Docker and the RAG service locally

set -e

echo "🚀 Starting AgentThink RAG Service (Development Mode)"
echo ""

# Check if Qdrant is already running
if docker ps | grep -q qdrant; then
    echo "✅ Qdrant is already running"
else
    echo "📦 Starting Qdrant..."
    docker run -d --name qdrant \
        -p 6333:6333 \
        -p 6334:6334 \
        -v qdrant_data:/qdrant/storage \
        qdrant/qdrant:latest
    
    echo "⏳ Waiting for Qdrant to be ready..."
    sleep 3
    echo "✅ Qdrant started"
fi

echo ""
echo "🔥 Starting RAG Service on port 8100..."
echo "📚 API Docs: http://localhost:8100/docs"
echo ""

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start the service with hot reload
uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload

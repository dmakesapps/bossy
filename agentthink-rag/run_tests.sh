#!/bin/bash
# Run tests for AgentThink RAG Service

set -e

echo "🧪 Running AgentThink RAG Tests"
echo ""

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check if Qdrant is running
echo "Checking Qdrant..."
if curl -s http://localhost:6333/health > /dev/null 2>&1; then
    echo "✅ Qdrant is running"
else
    echo "⚠️  Qdrant is not running - some tests will be skipped"
    echo "   Start with: docker run -d -p 6333:6333 qdrant/qdrant:latest"
fi
echo ""

# Install pytest if needed
pip install pytest -q

# Run tests
echo "Running unit tests..."
python -m pytest tests/ -v --tb=short

echo ""
echo "✅ All tests completed!"

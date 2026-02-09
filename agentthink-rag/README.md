# AgentThink RAG Service

Document ingestion, processing, and vector search for RAG (Retrieval-Augmented Generation).

## Overview

This service handles everything related to documents in the AgentThink system:
- **Parsing**: Extracts text from PDF, DOCX, CSV, TXT, and Markdown files
- **Chunking**: Splits documents into semantic chunks with overlap
- **Embedding**: Generates vector embeddings using sentence-transformers
- **Storage**: Stores vectors in Qdrant for fast similarity search
- **Search**: Retrieves relevant chunks for RAG queries

## Prerequisites

- Python 3.12+
- Docker (for Qdrant)

## Quick Start

### 1. Clone and Install

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Start Qdrant

```bash
docker run -d --name qdrant \
    -p 6333:6333 \
    -p 6334:6334 \
    -v qdrant_data:/qdrant/storage \
    qdrant/qdrant:latest
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

### 4. Run the Service

```bash
uvicorn app.main:app --port 8100 --reload
```

Or use the convenience script:
```bash
chmod +x run.sh
./run.sh
```

### 5. Access API Docs

Open http://localhost:8100/docs for the interactive Swagger UI.

## Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose up -d --build
```

This starts:
- RAG Service on port 8100
- Qdrant on port 6333

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/api/v1/health` | GET | Health check |
| `/api/v1/documents/upload` | POST | Upload document |
| `/api/v1/documents/{id}/status` | GET | Check processing status |
| `/api/v1/documents/{id}` | DELETE | Delete document |
| `/api/v1/search` | POST | Vector search |

### Upload Document

```bash
curl -X POST http://localhost:8100/api/v1/documents/upload \
  -F "file=@document.pdf" \
  -F "project_id=my_project" \
  -F "document_id=doc_123"
```

### Search

```bash
curl -X POST http://localhost:8100/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key findings?",
    "project_id": "my_project",
    "top_k": 5,
    "score_threshold": 0.7
  }'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QDRANT_HOST` | localhost | Qdrant server host |
| `QDRANT_PORT` | 6333 | Qdrant server port |
| `EMBEDDING_MODEL` | all-MiniLM-L6-v2 | Sentence-transformers model |
| `CHUNK_SIZE` | 512 | Chunk size in tokens |
| `CHUNK_OVERLAP` | 50 | Overlap between chunks |
| `UPLOAD_DIR` | ./uploads | Upload file storage |
| `MAX_FILE_SIZE_MB` | 100 | Max upload size |
| `ALLOWED_EXTENSIONS` | ["pdf","docx","csv","txt","md"] | Allowed file types |

## Project Structure

```
agentthink-rag/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Configuration
│   ├── routers/             # API endpoints
│   │   ├── documents.py     # Upload, status, delete
│   │   ├── search.py        # Vector search
│   │   └── health.py        # Health check
│   ├── services/            # Business logic
│   │   ├── parser.py        # Document parsing
│   │   ├── chunker.py       # Text chunking
│   │   ├── embedder.py      # Embeddings
│   │   ├── vector_store.py  # Qdrant client
│   │   └── processor.py     # Pipeline orchestrator
│   ├── models/              # Pydantic models
│   └── utils/               # Utilities
├── uploads/                 # Document storage
├── tests/                   # Test files
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT

"""
AgentThink RAG Service - Main FastAPI Application

This is the RAG engine for the AgentThink system.
Handles document parsing, chunking, embedding, and vector search.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import documents, search, health
from app.services.parser import DocumentParser
from app.services.chunker import ChunkingEngine
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStoreService
from app.services.processor import DocumentProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("AgentThink RAG Service starting...")
    
    config = get_settings()
    logger.info(f"Configuration loaded:")
    logger.info(f"  - Qdrant: {config.QDRANT_HOST}:{config.QDRANT_PORT}")
    logger.info(f"  - Embedding Model: {config.EMBEDDING_MODEL}")
    logger.info(f"  - Chunk Size: {config.CHUNK_SIZE} tokens")
    
    # Create upload directory
    upload_dir = Path(config.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"  - Upload Directory: {upload_dir.absolute()}")
    
    # Initialize services
    logger.info("Initializing services...")
    
    # Embedding service (loads model)
    embedder = EmbeddingService(model_name=config.EMBEDDING_MODEL)
    
    # Vector store (connects to Qdrant)
    vector_store = VectorStoreService(
        host=config.QDRANT_HOST,
        port=config.QDRANT_PORT
    )
    
    # Parser and chunker
    parser = DocumentParser()
    chunker = ChunkingEngine(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP
    )
    
    # Processor (orchestrator)
    processor = DocumentProcessor(parser, chunker, embedder, vector_store)
    
    # Store in app state for dependency injection
    app.state.config = config
    app.state.embedder = embedder
    app.state.vector_store = vector_store
    app.state.processor = processor
    
    logger.info("All services initialized successfully")
    logger.info("AgentThink RAG Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AgentThink RAG Service")


# Create FastAPI application
app = FastAPI(
    title="AgentThink RAG Service",
    description="Document ingestion, processing, and vector search for RAG",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(documents.router, prefix="/api/v1", tags=["Documents"])
app.include_router(search.router, prefix="/api/v1", tags=["Search"])


@app.get("/")
async def root():
    """Root endpoint returning service info."""
    return {
        "service": "agentthink-rag",
        "version": "1.0.0"
    }


# Dependency functions for routes
def get_config(request: Request):
    """Get configuration from app state."""
    return request.app.state.config


def get_processor(request: Request) -> DocumentProcessor:
    """Get document processor from app state."""
    return request.app.state.processor


def get_embedder(request: Request) -> EmbeddingService:
    """Get embedding service from app state."""
    return request.app.state.embedder


def get_vector_store(request: Request) -> VectorStoreService:
    """Get vector store service from app state."""
    return request.app.state.vector_store

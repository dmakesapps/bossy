"""
Search Router

Handles vector search queries for RAG retrieval.
"""

import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.models.search import SearchRequest, SearchResponse, SearchResult
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_embedder(request: Request) -> EmbeddingService:
    """Get embedder from app state."""
    return request.app.state.embedder


def get_vector_store(request: Request) -> VectorStoreService:
    """Get vector store from app state."""
    return request.app.state.vector_store


@router.post("/search", response_model=SearchResponse)
async def search_documents(request: Request, search_request: SearchRequest):
    """
    Search for relevant document chunks.
    
    Embeds the query and searches the vector store for similar chunks.
    Results are sorted by similarity score descending.
    
    Args:
        search_request: Search parameters including query, project_id, top_k, score_threshold
    
    Returns:
        List of matching chunks with scores and metadata
    """
    # Validate request
    if not search_request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty"
        )
    
    if not 1 <= search_request.top_k <= 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="top_k must be between 1 and 20"
        )
    
    if not 0.0 <= search_request.score_threshold <= 1.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="score_threshold must be between 0.0 and 1.0"
        )
    
    embedder = get_embedder(request)
    vector_store = get_vector_store(request)
    
    # Step 1: Embed the query
    try:
        query_embedding = embedder.embed_text(search_request.query)
    except Exception as e:
        logger.exception(f"Embedding failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Embedding service error"
        )
    
    # Step 2: Search Qdrant
    try:
        results = vector_store.search(
            project_id=search_request.project_id,
            query_embedding=query_embedding,
            top_k=search_request.top_k,
            score_threshold=search_request.score_threshold
        )
    except Exception as e:
        logger.exception(f"Search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Vector search service error"
        )
    
    # Step 3: Transform to response format
    search_results = [
        SearchResult(
            chunk_id=r["chunk_id"],
            document_id=r["document_id"],
            document_name=r["document_name"],
            content=r["content"],
            score=r["score"],
            metadata=r["metadata"]
        )
        for r in results
    ]
    
    logger.info(
        f"Search for '{search_request.query[:50]}...' in project "
        f"{search_request.project_id}: {len(search_results)} results"
    )
    
    return SearchResponse(results=search_results)

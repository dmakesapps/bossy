"""
Health Check Router

Provides health status endpoint for monitoring and load balancers.
"""

from fastapi import APIRouter, Response, Request, status

router = APIRouter()


@router.get("/health")
async def health_check(request: Request, response: Response):
    """
    Health check endpoint.
    
    Returns:
        - status: "healthy" or "unhealthy"
        - qdrant_connected: whether Qdrant is reachable
        - embedding_model_loaded: whether the embedding model is loaded
    
    Returns HTTP 200 if healthy, 503 if unhealthy.
    """
    # Check services from app state
    embedder = getattr(request.app.state, "embedder", None)
    vector_store = getattr(request.app.state, "vector_store", None)
    
    embedding_model_loaded = embedder.loaded if embedder else False
    qdrant_connected = vector_store.connected if vector_store else False
    is_local_mode = getattr(vector_store, "is_local_mode", False) if vector_store else False
    
    is_healthy = qdrant_connected and embedding_model_loaded
    
    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "qdrant_connected": qdrant_connected,
        "is_local_mode": is_local_mode,
        "embedding_model_loaded": embedding_model_loaded
    }

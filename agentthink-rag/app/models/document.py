"""
Document Pydantic Models

Request and response models for document endpoints.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    """Response returned when a document is uploaded for processing."""
    
    status: str = Field(
        description="Processing status, typically 'processing' for new uploads"
    )
    document_id: str = Field(
        description="Unique identifier for the document"
    )
    message: str = Field(
        description="Human-readable status message"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "processing",
                "document_id": "abc123",
                "message": "Document queued for processing"
            }
        }
    }


class DocumentStatusResponse(BaseModel):
    """Response for document processing status."""
    
    document_id: str = Field(
        description="Unique identifier for the document"
    )
    status: Literal["pending", "processing", "ready", "error"] = Field(
        description="Current processing status"
    )
    chunk_count: int = Field(
        default=0,
        description="Number of chunks created (populated when status is 'ready')"
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Error details if status is 'error'"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "document_id": "abc123",
                "status": "ready",
                "chunk_count": 47,
                "error_message": None
            }
        }
    }


class DocumentDeleteResponse(BaseModel):
    """Response when a document is deleted."""
    
    status: str = Field(
        description="Deletion status, typically 'deleted'"
    )
    chunks_removed: int = Field(
        description="Number of chunks removed from the vector store"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "deleted",
                "chunks_removed": 47
            }
        }
    }


class DocumentListItem(BaseModel):
    """Information about a single document in a list."""
    
    document_id: str
    filename: str
    status: str
    chunk_count: int = 0
    created_at: float
    error_message: Optional[str] = None


class DocumentListResponse(BaseModel):
    """Response for listing project documents."""
    
    documents: list[DocumentListItem]


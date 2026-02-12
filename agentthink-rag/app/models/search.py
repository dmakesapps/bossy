"""
Search Pydantic Models

Request and response models for search endpoints.
"""

from typing import Dict, List, Any
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Request body for vector search."""
    
    query: str = Field(
        description="The search query text"
    )
    project_id: str = Field(
        description="Project identifier to search within"
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of results to return"
    )
    score_threshold: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score threshold"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "query": "What are the key financial projections for Q3?",
                "project_id": "proj_xyz",
                "top_k": 5,
                "score_threshold": 0.3
            }
        }
    }


class SearchResult(BaseModel):
    """A single search result."""
    
    chunk_id: str = Field(
        description="Unique identifier for the chunk"
    )
    document_id: str = Field(
        description="Identifier of the source document"
    )
    document_name: str = Field(
        description="Original filename of the source document"
    )
    content: str = Field(
        description="The chunk text content"
    )
    score: float = Field(
        description="Similarity score (higher is better)"
    )
    metadata: Dict[str, Any] = Field(
        description="Additional metadata including page_number, section, chunk_index"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "chunk_id": "chunk_001",
                "document_id": "doc_abc",
                "document_name": "Q3_Report.pdf",
                "content": "The financial projections for Q3 indicate...",
                "score": 0.92,
                "metadata": {
                    "page_number": 12,
                    "section": "Financial Overview",
                    "chunk_index": 3
                }
            }
        }
    }


class SearchResponse(BaseModel):
    """Response containing search results."""
    
    results: List[SearchResult] = Field(
        default_factory=list,
        description="List of matching chunks sorted by score descending"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "results": [
                    {
                        "chunk_id": "chunk_001",
                        "document_id": "doc_abc",
                        "document_name": "Q3_Report.pdf",
                        "content": "The financial projections for Q3 indicate...",
                        "score": 0.92,
                        "metadata": {
                            "page_number": 12,
                            "section": "Financial Overview",
                            "chunk_index": 3
                        }
                    }
                ]
            }
        }
    }

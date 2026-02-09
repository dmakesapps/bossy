"""
Vector Store Service

Qdrant client wrapper for vector operations:
- Collection management
- Chunk storage and retrieval
- Similarity search
"""

import logging
from typing import Optional, Any
from uuid import UUID

from app.services.chunker import Chunk

logger = logging.getLogger(__name__)


class VectorStoreService:
    """
    Qdrant vector store wrapper.
    
    Provides high-level operations for managing vectors:
    - Collection creation and management
    - Upserting chunks with embeddings
    - Similarity search
    - Document-level deletion
    """
    
    def __init__(self, host: str = "localhost", port: int = 6333):
        """
        Initialize connection to Qdrant.
        
        Args:
            host: Qdrant server host
            port: Qdrant server gRPC port
        """
        self.host = host
        self.port = port
        self._client = None
        self._is_connected = False
        self._is_local_mode = False
        
        self._connect()
    
    @property
    def is_local_mode(self) -> bool:
        """Return whether using local in-memory mode."""
        return self._is_local_mode

    def _connect(self) -> None:
        """Establish connection to Qdrant."""
        try:
            from qdrant_client import QdrantClient
            
            logger.info(f"Attempting to connect to Qdrant at {self.host}:{self.port}")
            self._client = QdrantClient(host=self.host, port=self.port, timeout=2.0)
            
            # Test connection by getting collections
            self._client.get_collections()
            self._is_connected = True
            self._is_local_mode = False
            
            logger.info(f"Connected to Qdrant at {self.host}:{self.port}")
            
        except Exception as e:
            logger.warning(f"Failed to connect to Qdrant: {e}")
            logger.info("Falling back to local in-memory Qdrant instance for development")
            
            try:
                from qdrant_client import QdrantClient
                # Initialize local in-memory client
                self._client = QdrantClient(location=":memory:")
                self._is_connected = True
                self._is_local_mode = True
                logger.info("Initialized local in-memory Qdrant instance")
            except Exception as inner_e:
                logger.error(f"Failed to initialize local Qdrant: {inner_e}")
                self._is_connected = False
                self._is_local_mode = False
    
    @property
    def connected(self) -> bool:
        """Return whether connected to Qdrant."""
        return self._is_connected
    
    def _get_collection_name(self, project_id: str) -> str:
        """Get the collection name for a project."""
        # Sanitize project_id for use as collection name
        return f"project_{project_id.replace('-', '_')}"
    
    def ensure_collection(self, project_id: str, vector_size: int) -> None:
        """
        Ensure a collection exists for the project.
        
        Args:
            project_id: Project identifier
            vector_size: Dimension of embedding vectors
        """
        if not self._is_connected or self._client is None:
            logger.error("Cannot ensure collection: not connected to Qdrant")
            return
        
        from qdrant_client.models import Distance, VectorParams
        
        collection_name = self._get_collection_name(project_id)
        
        try:
            # Check if collection exists
            if self._client.collection_exists(collection_name):
                logger.debug(f"Collection '{collection_name}' already exists")
                return
            
            # Create collection
            self._client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )
            
            logger.info(f"Collection '{collection_name}' created")
            
        except Exception as e:
            logger.exception(f"Error ensuring collection: {e}")
    
    def upsert_chunks(
        self,
        project_id: str,
        chunks: list[Chunk],
        embeddings: list[list[float]]
    ) -> int:
        """
        Upsert chunks with their embeddings to Qdrant.
        
        Args:
            project_id: Project identifier
            chunks: List of Chunk objects
            embeddings: Corresponding embedding vectors
            
        Returns:
            Number of points upserted
        """
        if not self._is_connected or self._client is None:
            logger.error("Cannot upsert: not connected to Qdrant")
            return 0
        
        if len(chunks) != len(embeddings):
            logger.error("Chunks and embeddings count mismatch")
            return 0
        
        from qdrant_client.models import PointStruct
        
        collection_name = self._get_collection_name(project_id)
        
        # Ensure collection exists
        vector_size = len(embeddings[0]) if embeddings else 384
        self.ensure_collection(project_id, vector_size)
        
        # Build points
        points = []
        for chunk, embedding in zip(chunks, embeddings):
            point = PointStruct(
                id=chunk.chunk_id,
                vector=embedding,
                payload={
                    "chunk_id": chunk.chunk_id,
                    "document_id": chunk.document_id,
                    "document_name": chunk.document_name,
                    "content": chunk.content,
                    "page_number": chunk.metadata.get("page_number"),
                    "section_title": chunk.metadata.get("section_title"),
                    "chunk_index": chunk.metadata.get("chunk_index"),
                    "char_count": chunk.metadata.get("char_count"),
                }
            )
            points.append(point)
        
        # Upsert in batches
        batch_size = 100
        total_upserted = 0
        
        try:
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                self._client.upsert(
                    collection_name=collection_name,
                    points=batch
                )
                total_upserted += len(batch)
            
            logger.info(f"Upserted {total_upserted} chunks to collection '{collection_name}'")
            return total_upserted
            
        except Exception as e:
            logger.exception(f"Error upserting chunks: {e}")
            return total_upserted
    
    def search(
        self,
        project_id: str,
        query_embedding: list[float],
        top_k: int = 5,
        score_threshold: float = 0.7
    ) -> list[dict]:
        """
        Search for similar chunks.
        
        Args:
            project_id: Project identifier
            query_embedding: Query vector
            top_k: Maximum results to return
            score_threshold: Minimum similarity score
            
        Returns:
            List of search results with scores
        """
        if not self._is_connected or self._client is None:
            logger.error("Cannot search: not connected to Qdrant")
            return []
        
        collection_name = self._get_collection_name(project_id)
        
        try:
            # Check if collection exists
            if not self._client.collection_exists(collection_name):
                logger.debug(f"Collection '{collection_name}' does not exist")
                return []
            
            # Perform search
            results = self._client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=top_k,
                score_threshold=score_threshold
            )
            
            # Transform to result dicts
            search_results = []
            for hit in results:
                result = {
                    "chunk_id": hit.payload.get("chunk_id"),
                    "document_id": hit.payload.get("document_id"),
                    "document_name": hit.payload.get("document_name"),
                    "content": hit.payload.get("content"),
                    "score": hit.score,
                    "metadata": {
                        "page_number": hit.payload.get("page_number"),
                        "section_title": hit.payload.get("section_title"),
                        "chunk_index": hit.payload.get("chunk_index"),
                    }
                }
                search_results.append(result)
            
            # Sort by score descending
            search_results.sort(key=lambda x: x["score"], reverse=True)
            
            query_preview = query_embedding[:3] if len(query_embedding) > 3 else query_embedding
            logger.info(
                f"Search in '{collection_name}': {len(search_results)} results "
                f"(vector prefix: {query_preview}...)"
            )
            
            return search_results
            
        except Exception as e:
            logger.exception(f"Error searching: {e}")
            return []
    
    def delete_document_chunks(self, project_id: str, document_id: str) -> int:
        """
        Delete all chunks for a document.
        
        Args:
            project_id: Project identifier
            document_id: Document identifier
            
        Returns:
            Number of chunks deleted
        """
        if not self._is_connected or self._client is None:
            logger.error("Cannot delete: not connected to Qdrant")
            return 0
        
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        
        collection_name = self._get_collection_name(project_id)
        
        try:
            # Check if collection exists
            if not self._client.collection_exists(collection_name):
                return 0
            
            # Count matching points first
            count_result = self._client.count(
                collection_name=collection_name,
                count_filter=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id)
                        )
                    ]
                )
            )
            count = count_result.count
            
            if count == 0:
                return 0
            
            # Delete matching points
            self._client.delete(
                collection_name=collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id)
                        )
                    ]
                )
            )
            
            logger.info(
                f"Deleted {count} chunks for document {document_id} "
                f"from '{collection_name}'"
            )
            return count
            
        except Exception as e:
            logger.exception(f"Error deleting chunks: {e}")
            return 0
    
    def delete_collection(self, project_id: str) -> bool:
        """
        Delete an entire project collection.
        
        Args:
            project_id: Project identifier
            
        Returns:
            True if deleted, False otherwise
        """
        if not self._is_connected or self._client is None:
            logger.error("Cannot delete collection: not connected to Qdrant")
            return False
        
        collection_name = self._get_collection_name(project_id)
        
        try:
            if not self._client.collection_exists(collection_name):
                return False
            
            self._client.delete_collection(collection_name)
            logger.info(f"Deleted collection '{collection_name}'")
            return True
            
        except Exception as e:
            logger.exception(f"Error deleting collection: {e}")
            return False
    
    def get_collection_info(self, project_id: str) -> Optional[dict]:
        """
        Get information about a collection.
        
        Args:
            project_id: Project identifier
            
        Returns:
            Collection info dict or None if doesn't exist
        """
        if not self._is_connected or self._client is None:
            return None
        
        collection_name = self._get_collection_name(project_id)
        
        try:
            if not self._client.collection_exists(collection_name):
                return None
            
            info = self._client.get_collection(collection_name)
            
            return {
                "name": collection_name,
                "points_count": info.points_count,
                "status": str(info.status),
            }
            
        except Exception as e:
            logger.error(f"Error getting collection info: {e}")
            return None

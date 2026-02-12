"""
Document Processor Service

Orchestrates the full document processing pipeline:
Parse → Chunk → Embed → Store

Also manages processing status tracking.
"""

import logging
import time
import traceback
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.models.document import DocumentStatusResponse
from app.services.parser import DocumentParser
from app.services.chunker import ChunkingEngine
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


# In-memory processing status tracker
# Key: document_id, Value: DocumentStatusResponse
_processing_status: dict[str, DocumentStatusResponse] = {}


def update_status(
    document_id: str,
    status: str,
    chunk_count: int = 0,
    error_message: Optional[str] = None
) -> None:
    """Update the processing status for a document."""
    _processing_status[document_id] = DocumentStatusResponse(
        document_id=document_id,
        status=status,
        chunk_count=chunk_count,
        error_message=error_message
    )


def get_status(document_id: str) -> Optional[DocumentStatusResponse]:
    """Get the processing status for a document."""
    return _processing_status.get(document_id)


def clear_status(document_id: str) -> None:
    """Remove the processing status for a document."""
    _processing_status.pop(document_id, None)


@dataclass
class ProcessingResult:
    """Result of document processing."""
    
    document_id: str
    """Document identifier."""
    
    status: str
    """Processing status: 'ready' or 'error'."""
    
    chunk_count: int
    """Number of chunks created."""
    
    error_message: Optional[str] = None
    """Error details if status is 'error'."""
    
    processing_time_seconds: float = 0.0
    """Total processing time."""


class DocumentProcessor:
    """
    Document processing orchestrator.
    
    Coordinates the full pipeline:
    1. Parse document to extract sections
    2. Chunk sections into smaller pieces
    3. Generate embeddings for chunks
    4. Store chunks and embeddings in Qdrant
    """
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'csv', 'txt', 'md'}
    
    def __init__(
        self,
        parser: DocumentParser,
        chunker: ChunkingEngine,
        embedder: EmbeddingService,
        vector_store: VectorStoreService
    ):
        """
        Initialize the processor with all required services.
        
        Args:
            parser: Document parser service
            chunker: Chunking engine
            embedder: Embedding service
            vector_store: Vector store service
        """
        self.parser = parser
        self.chunker = chunker
        self.embedder = embedder
        self.vector_store = vector_store
    
    def process_document(
        self,
        file_path: str,
        project_id: str,
        document_id: str,
        filename: str
    ) -> ProcessingResult:
        """
        Process a document through the full pipeline.
        
        Args:
            file_path: Path to the document file
            project_id: Project identifier
            document_id: Document identifier
            filename: Original filename
            
        Returns:
            ProcessingResult with status and chunk count
        """
        start_time = time.time()
        
        try:
            # Step 1: Determine and validate file type
            file_ext = Path(filename).suffix.lower().lstrip('.')
            
            if file_ext not in self.ALLOWED_EXTENSIONS:
                return self._error_result(
                    document_id,
                    f"Unsupported file type: .{file_ext}",
                    start_time
                )
            
            logger.info(f"Processing document: {filename} (type: {file_ext})")
            update_status(document_id, "processing")
            
            # Step 0: Clear existing chunks for this document (if any)
            # This ensures we don't double up on chunks if re-processing
            logger.info(f"Clearing existing chunks for document {document_id}")
            self.delete_document(project_id, document_id)
            
            # Step 2: Parse
            logger.info(f"Step 1/4 Parse: extracting from {filename}")
            sections = self.parser.parse(file_path, file_ext)
            
            if not sections:
                return self._error_result(
                    document_id,
                    "No content could be extracted from the document",
                    start_time
                )
            
            logger.info(f"Step 1/4 Parse: {len(sections)} sections from {filename}")
            
            # Step 3: Chunk
            logger.info(f"Step 2/4 Chunk: splitting into chunks")
            chunks = self.chunker.chunk_document(sections, document_id, filename)
            
            if not chunks:
                return self._error_result(
                    document_id,
                    "Document could not be chunked",
                    start_time
                )
            
            logger.info(f"Step 2/4 Chunk: {len(chunks)} chunks created")
            
            # Step 4: Embed
            logger.info(f"Step 3/4 Embed: generating embeddings")
            contents = [chunk.content for chunk in chunks]
            embeddings = self.embedder.embed_batch(contents, batch_size=32)
            
            if len(embeddings) != len(chunks):
                return self._error_result(
                    document_id,
                    "Embedding generation failed",
                    start_time
                )
            
            logger.info(f"Step 3/4 Embed: {len(embeddings)} embeddings generated")
            
            # Step 5: Store
            logger.info(f"Step 4/4 Store: upserting to Qdrant")
            upserted = self.vector_store.upsert_chunks(project_id, chunks, embeddings)
            
            if upserted == 0:
                return self._error_result(
                    document_id,
                    "Failed to store vectors in Qdrant",
                    start_time
                )
            
            logger.info(f"Step 4/4 Store: {upserted} vectors upserted to Qdrant")
            
            # Success!
            processing_time = time.time() - start_time
            
            update_status(document_id, "ready", chunk_count=upserted)
            
            logger.info(
                f"Document processed successfully: {filename} "
                f"({upserted} chunks in {processing_time:.2f}s)"
            )
            
            return ProcessingResult(
                document_id=document_id,
                status="ready",
                chunk_count=upserted,
                processing_time_seconds=processing_time
            )
            
        except Exception as e:
            logger.exception(f"Error processing document {document_id}: {e}")
            return self._error_result(
                document_id,
                str(e),
                start_time
            )
    
    def delete_document(self, project_id: str, document_id: str) -> int:
        """
        Delete a document's chunks from the vector store.
        
        Args:
            project_id: Project identifier
            document_id: Document identifier
            
        Returns:
            Number of chunks deleted
        """
        return self.vector_store.delete_document_chunks(project_id, document_id)
    
    def _error_result(
        self,
        document_id: str,
        error_message: str,
        start_time: float
    ) -> ProcessingResult:
        """Create an error result and update status."""
        processing_time = time.time() - start_time
        
        update_status(document_id, "error", error_message=error_message)
        
        return ProcessingResult(
            document_id=document_id,
            status="error",
            chunk_count=0,
            error_message=error_message,
            processing_time_seconds=processing_time
        )

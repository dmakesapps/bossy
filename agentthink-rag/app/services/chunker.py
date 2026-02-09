"""
Chunking Engine Service

Implements hybrid chunking strategy: paragraph → sentence splitting with overlap.
Ensures chunks are self-contained with context prefixes.
"""

import logging
import re
import uuid
from dataclasses import dataclass, field
from typing import Optional

from app.services.parser import ParsedSection

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    """Represents a chunk of text ready for embedding."""
    
    chunk_id: str
    """Unique identifier for this chunk (UUID)."""
    
    content: str
    """The chunk text with context prefix."""
    
    document_id: str
    """ID of the source document."""
    
    document_name: str
    """Original filename of the source document."""
    
    metadata: dict = field(default_factory=dict)
    """Metadata including page_number, section_title, chunk_index, etc."""


class ChunkingEngine:
    """
    Hybrid chunking engine.
    
    Chunks documents using a combined strategy:
    1. First split at paragraph boundaries
    2. If paragraphs are too long, split at sentence boundaries
    3. Apply overlap between chunks for context continuity
    """
    
    # Regex pattern for sentence splitting
    # Handles: . ! ? followed by space and capital letter or newline
    # Avoids splitting on: Mr. Mrs. Dr. etc., decimal numbers, abbreviations
    SENTENCE_SPLIT_PATTERN = re.compile(
        r'(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s*\n'
    )
    
    # Common abbreviations that shouldn't cause sentence splits
    ABBREVIATIONS = {'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'vs', 'etc', 'Inc', 'Ltd', 'Co'}
    
    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50):
        """
        Initialize the chunking engine.
        
        Args:
            chunk_size: Target chunk size in tokens (1 token ≈ 4 chars)
            chunk_overlap: Overlap between chunks in tokens
        """
        self.chunk_size_chars = chunk_size * 4  # Convert tokens to chars
        self.chunk_overlap_chars = chunk_overlap * 4
        
        logger.info(f"ChunkingEngine initialized: size={chunk_size} tokens, overlap={chunk_overlap} tokens")
    
    def chunk_document(
        self,
        sections: list[ParsedSection],
        document_id: str,
        document_name: str
    ) -> list[Chunk]:
        """
        Chunk a document's sections into smaller pieces.
        
        Args:
            sections: List of ParsedSection from the parser
            document_id: Unique document identifier
            document_name: Original filename
            
        Returns:
            List of Chunk objects ready for embedding
        """
        chunks = []
        chunk_index = 0
        
        for section in sections:
            # Check if this is a table - don't split tables
            is_table = section.metadata.get("type") == "table"
            
            if is_table:
                # Tables stay intact regardless of size
                section_chunks = [section.content]
            else:
                # Apply chunking strategy
                section_chunks = self._chunk_section(section)
            
            for chunk_text in section_chunks:
                # Add context prefix
                prefixed_content = self._add_context_prefix(
                    chunk_text, section, document_name
                )
                
                chunk = Chunk(
                    chunk_id=str(uuid.uuid4()),
                    content=prefixed_content,
                    document_id=document_id,
                    document_name=document_name,
                    metadata={
                        "page_number": section.page_number,
                        "section_title": section.section_title,
                        "chunk_index": chunk_index,
                        "char_count": len(prefixed_content),
                        "token_estimate": len(prefixed_content) // 4,
                        "doc_type": section.doc_type,
                        "is_table": is_table
                    }
                )
                chunks.append(chunk)
                chunk_index += 1
        
        logger.info(f"Chunked {document_name}: {len(sections)} sections → {len(chunks)} chunks")
        return chunks
    
    def _chunk_section(self, section: ParsedSection) -> list[str]:
        """
        Chunk a single section using the hybrid strategy.
        
        Args:
            section: The section to chunk
            
        Returns:
            List of chunk text strings
        """
        content = section.content
        
        # If content is small enough, return as single chunk
        if len(content) <= self.chunk_size_chars:
            return [content]
        
        # Step 1: Split at paragraph boundaries
        paragraphs = self._split_at_paragraphs(content)
        
        # Step 2: Split large paragraphs at sentence boundaries
        processed_parts = []
        for para in paragraphs:
            if len(para) <= self.chunk_size_chars:
                processed_parts.append(para)
            else:
                # Split at sentences
                sentences = self._split_at_sentences(para)
                processed_parts.extend(sentences)
        
        # Step 3: Combine parts into chunks with overlap
        chunks = self._combine_with_overlap(processed_parts)
        
        return chunks
    
    def _split_at_paragraphs(self, text: str) -> list[str]:
        """
        Split text at paragraph boundaries (double newlines).
        
        Args:
            text: Text to split
            
        Returns:
            List of paragraph strings
        """
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
    
    def _split_at_sentences(self, text: str) -> list[str]:
        """
        Split text at sentence boundaries.
        
        Handles common edge cases like abbreviations and decimal numbers.
        
        Args:
            text: Text to split
            
        Returns:
            List of sentences
        """
        # First, protect abbreviations by temporarily replacing periods
        protected_text = text
        for abbrev in self.ABBREVIATIONS:
            protected_text = re.sub(
                rf'\b{abbrev}\.',
                f'{abbrev}<<<DOT>>>',
                protected_text
            )
        
        # Protect decimal numbers
        protected_text = re.sub(r'(\d)\.(\d)', r'\1<<<DOT>>>\2', protected_text)
        
        # Split at sentence boundaries
        sentences = self.SENTENCE_SPLIT_PATTERN.split(protected_text)
        
        # Restore protected periods
        sentences = [s.replace('<<<DOT>>>', '.').strip() for s in sentences]
        
        # Filter out empty sentences
        sentences = [s for s in sentences if s]
        
        return sentences
    
    def _combine_with_overlap(self, parts: list[str]) -> list[str]:
        """
        Combine parts into chunks with overlap.
        
        Args:
            parts: List of text parts (paragraphs or sentences)
            
        Returns:
            List of chunks with overlap applied
        """
        if not parts:
            return []
        
        chunks = []
        current_chunk_parts = []
        current_length = 0
        
        for i, part in enumerate(parts):
            part_length = len(part)
            
            # Check if adding this part would exceed chunk size
            # Account for the space/newline separator
            separator_length = 2 if current_chunk_parts else 0
            
            if current_length + separator_length + part_length > self.chunk_size_chars:
                # Save current chunk if it has content
                if current_chunk_parts:
                    chunk_text = "\n\n".join(current_chunk_parts)
                    chunks.append(chunk_text)
                    
                    # Start new chunk with overlap from previous
                    current_chunk_parts, current_length = self._get_overlap_parts(
                        current_chunk_parts
                    )
            
            current_chunk_parts.append(part)
            current_length += separator_length + part_length
        
        # Don't forget the last chunk
        if current_chunk_parts:
            chunk_text = "\n\n".join(current_chunk_parts)
            chunks.append(chunk_text)
        
        return chunks
    
    def _get_overlap_parts(self, parts: list[str]) -> tuple[list[str], int]:
        """
        Get the overlap portion from the end of parts.
        
        Args:
            parts: List of current parts
            
        Returns:
            Tuple of (overlap_parts, total_length)
        """
        overlap_parts = []
        overlap_length = 0
        
        # Work backwards to collect overlap
        for part in reversed(parts):
            if overlap_length + len(part) <= self.chunk_overlap_chars:
                overlap_parts.insert(0, part)
                overlap_length += len(part) + 2  # +2 for separator
            else:
                # Take partial overlap from this part
                remaining = self.chunk_overlap_chars - overlap_length
                if remaining > 0 and len(part) > 0:
                    overlap_parts.insert(0, part[-remaining:])
                    overlap_length += remaining
                break
        
        return overlap_parts, overlap_length
    
    def _add_context_prefix(
        self,
        chunk_text: str,
        section: ParsedSection,
        document_name: str
    ) -> str:
        """
        Add contextual prefix to make chunk self-contained.
        
        Format: [Document: name] [Page X] [Section: title]
        
        Args:
            chunk_text: The chunk content
            section: Source section with metadata
            document_name: Original document filename
            
        Returns:
            Chunk text with context prefix
        """
        prefix_parts = [f"[Document: {document_name}]"]
        
        if section.page_number:
            prefix_parts.append(f"[Page {section.page_number}]")
        
        if section.section_title:
            prefix_parts.append(f"[Section: {section.section_title}]")
        
        prefix = " ".join(prefix_parts)
        
        return f"{prefix}\n{chunk_text}"

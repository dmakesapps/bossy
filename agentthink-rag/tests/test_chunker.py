"""
Tests for the chunking engine.
"""

import pytest

from app.services.chunker import ChunkingEngine, Chunk
from app.services.parser import ParsedSection


class TestChunkingEngine:
    """Tests for the chunking engine."""
    
    @pytest.fixture
    def chunker(self):
        """Create a chunker with small size for testing."""
        # 50 tokens = 200 chars, 10 tokens = 40 chars overlap
        return ChunkingEngine(chunk_size=50, chunk_overlap=10)
    
    @pytest.fixture
    def large_chunker(self):
        """Create a chunker with default size."""
        return ChunkingEngine()
    
    def test_short_text_single_chunk(self, chunker):
        """Short text should return a single chunk."""
        section = ParsedSection(
            content="This is a short sentence.",
            doc_type="txt"
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "test.txt")
        
        assert len(chunks) == 1
        assert chunks[0].document_id == "doc_123"
        assert chunks[0].document_name == "test.txt"
    
    def test_long_text_multiple_chunks(self, chunker):
        """Long text should be split into multiple chunks."""
        # Create text that's definitely longer than 200 chars
        long_text = " ".join(["This is sentence number " + str(i) + "." for i in range(20)])
        
        section = ParsedSection(
            content=long_text,
            doc_type="txt"
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "test.txt")
        
        assert len(chunks) > 1
    
    def test_chunk_index_sequential(self, chunker):
        """Chunk indices should be sequential across all sections."""
        sections = [
            ParsedSection(content="First section content here.", doc_type="txt"),
            ParsedSection(content="Second section content here.", doc_type="txt"),
            ParsedSection(content="Third section content here.", doc_type="txt"),
        ]
        
        chunks = chunker.chunk_document(sections, "doc_123", "test.txt")
        
        indices = [c.metadata["chunk_index"] for c in chunks]
        assert indices == list(range(len(chunks)))
    
    def test_context_prefix_document_name(self, chunker):
        """Context prefix should include document name."""
        section = ParsedSection(
            content="Some test content here.",
            doc_type="txt"
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "report.pdf")
        
        assert "[Document: report.pdf]" in chunks[0].content
    
    def test_context_prefix_page_number(self, chunker):
        """Context prefix should include page number if present."""
        section = ParsedSection(
            content="Some test content here.",
            page_number=5,
            doc_type="pdf"
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "report.pdf")
        
        assert "[Page 5]" in chunks[0].content
    
    def test_context_prefix_section_title(self, chunker):
        """Context prefix should include section title if present."""
        section = ParsedSection(
            content="Some test content here.",
            section_title="Introduction",
            doc_type="docx"
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "report.docx")
        
        assert "[Section: Introduction]" in chunks[0].content
    
    def test_table_not_split(self, chunker):
        """Tables should remain intact regardless of size."""
        # Create a large table that would normally be split
        table_content = "| " + " | ".join(["Column" + str(i) for i in range(10)]) + " |\n"
        table_content += "| " + " | ".join(["Value" + str(i) for i in range(10)]) + " |\n" * 20
        
        section = ParsedSection(
            content=table_content,
            doc_type="pdf",
            metadata={"type": "table"}
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "data.pdf")
        
        # Table should be single chunk
        assert len(chunks) == 1
    
    def test_chunk_uuid_format(self, chunker):
        """Chunk IDs should be valid UUIDs."""
        import uuid
        
        section = ParsedSection(
            content="Test content for UUID check.",
            doc_type="txt"
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "test.txt")
        
        # Should not raise
        uuid.UUID(chunks[0].chunk_id)
    
    def test_metadata_includes_char_count(self, chunker):
        """Chunks should have char_count in metadata."""
        section = ParsedSection(
            content="Test content here.",
            doc_type="txt"
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "test.txt")
        
        assert "char_count" in chunks[0].metadata
        assert chunks[0].metadata["char_count"] > 0
    
    def test_metadata_includes_token_estimate(self, chunker):
        """Chunks should have token_estimate in metadata."""
        section = ParsedSection(
            content="Test content here.",
            doc_type="txt"
        )
        
        chunks = chunker.chunk_document([section], "doc_123", "test.txt")
        
        assert "token_estimate" in chunks[0].metadata
        # Token estimate is char_count // 4
        assert chunks[0].metadata["token_estimate"] == chunks[0].metadata["char_count"] // 4


class TestSentenceSplitting:
    """Tests for sentence splitting edge cases."""
    
    @pytest.fixture
    def chunker(self):
        return ChunkingEngine(chunk_size=20, chunk_overlap=5)
    
    def test_abbreviations_not_split(self, chunker):
        """Abbreviations like Mr. Dr. should not cause splits."""
        sentences = chunker._split_at_sentences(
            "Dr. Smith went to the store. He met Mr. Jones there."
        )
        
        # Should not split at Dr. or Mr.
        assert any("Dr. Smith" in s for s in sentences)
        assert any("Mr. Jones" in s for s in sentences)
    
    def test_decimal_numbers_not_split(self, chunker):
        """Decimal numbers like 3.14 should not cause splits."""
        sentences = chunker._split_at_sentences(
            "The value is 3.14159. This is pi."
        )
        
        # Should not split at 3.
        assert any("3.14159" in s for s in sentences)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

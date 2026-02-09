"""
Integration tests for the search pipeline.

Requires Qdrant to be running on localhost:6333.
"""

import tempfile
import time
import pytest

from app.services.parser import DocumentParser
from app.services.chunker import ChunkingEngine
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStoreService
from app.services.processor import DocumentProcessor


@pytest.fixture(scope="module")
def embedder():
    """Create embedder (slow - reuse across tests)."""
    return EmbeddingService()


@pytest.fixture(scope="module")
def vector_store():
    """Create vector store."""
    return VectorStoreService()


@pytest.fixture
def parser():
    """Create parser."""
    return DocumentParser()


@pytest.fixture
def chunker():
    """Create chunker."""
    return ChunkingEngine()


@pytest.fixture
def processor(parser, chunker, embedder, vector_store):
    """Create processor."""
    return DocumentProcessor(parser, chunker, embedder, vector_store)


class TestEmbedder:
    """Tests for embedding service."""
    
    def test_embed_text(self, embedder):
        """Test single text embedding."""
        if not embedder.loaded:
            pytest.skip("Embedding model not loaded")
        
        embedding = embedder.embed_text("Hello world")
        
        assert len(embedding) == embedder.dimension
        assert all(isinstance(x, float) for x in embedding)
    
    def test_embed_batch(self, embedder):
        """Test batch embedding."""
        if not embedder.loaded:
            pytest.skip("Embedding model not loaded")
        
        texts = ["Hello", "World", "Test"]
        embeddings = embedder.embed_batch(texts)
        
        assert len(embeddings) == 3
        assert all(len(e) == embedder.dimension for e in embeddings)


class TestVectorStore:
    """Tests for vector store (requires Qdrant)."""
    
    @pytest.fixture
    def test_project_id(self):
        """Generate unique test project ID."""
        return f"test_project_{int(time.time())}"
    
    def test_connection_status(self, vector_store):
        """Test connection tracking."""
        # Just verify the status is tracked
        assert isinstance(vector_store.connected, bool)
    
    @pytest.mark.skipif(True, reason="Requires Qdrant running")
    def test_ensure_collection(self, vector_store, test_project_id):
        """Test collection creation."""
        if not vector_store.connected:
            pytest.skip("Qdrant not connected")
        
        vector_store.ensure_collection(test_project_id, 384)
        
        info = vector_store.get_collection_info(test_project_id)
        assert info is not None
        
        # Cleanup
        vector_store.delete_collection(test_project_id)


class TestSearchPipeline:
    """End-to-end search pipeline tests (requires Qdrant)."""
    
    @pytest.fixture
    def test_project_id(self):
        """Generate unique test project ID."""
        return f"test_pipeline_{int(time.time())}"
    
    @pytest.mark.skipif(True, reason="Requires Qdrant running")
    def test_full_pipeline(self, processor, embedder, vector_store, test_project_id):
        """Test full document processing pipeline."""
        if not vector_store.connected:
            pytest.skip("Qdrant not connected")
        if not embedder.loaded:
            pytest.skip("Embedding model not loaded")
        
        # Create a test document
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("""
            Climate Change Overview
            
            Climate change refers to long-term shifts in temperatures and weather patterns.
            Human activities have been the main driver of climate change since the 1800s.
            The burning of fossil fuels like coal, oil, and gas produces greenhouse gases.
            
            Effects of Climate Change
            
            Rising temperatures are causing ice sheets to melt and sea levels to rise.
            More frequent extreme weather events are affecting communities worldwide.
            Ecosystems and biodiversity are under significant pressure.
            """)
            f.flush()
            
            # Process document
            result = processor.process_document(
                file_path=f.name,
                project_id=test_project_id,
                document_id="test_doc_1",
                filename="climate.txt"
            )
            
            assert result.status == "ready"
            assert result.chunk_count > 0
        
        # Search for relevant content
        query_embedding = embedder.embed_text("What causes global warming?")
        
        results = vector_store.search(
            project_id=test_project_id,
            query_embedding=query_embedding,
            top_k=5,
            score_threshold=0.5
        )
        
        assert len(results) > 0
        assert any("fossil fuels" in r["content"].lower() for r in results)
        
        # Cleanup
        vector_store.delete_collection(test_project_id)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

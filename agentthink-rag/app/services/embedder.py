"""
Embedding Service

Generates vector embeddings using sentence-transformers.
Model is loaded once at startup and reused for all requests.
"""

import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Embedding service using sentence-transformers.
    
    The model is loaded once during initialization and reused
    for all embedding requests.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service.
        
        Args:
            model_name: Name of the sentence-transformers model to use
        """
        self.model_name = model_name
        self._model = None
        self._dimension: Optional[int] = None
        self._is_loaded = False
        
        self._load_model()
    
    def _load_model(self) -> None:
        """Load the sentence-transformers model."""
        try:
            from sentence_transformers import SentenceTransformer
            
            logger.info(f"Loading embedding model '{self.model_name}'...")
            start_time = time.time()
            
            self._model = SentenceTransformer(self.model_name)
            
            # Get dimension by encoding a test string
            test_embedding = self._model.encode("test", convert_to_numpy=True)
            self._dimension = len(test_embedding)
            
            self._is_loaded = True
            
            load_time = time.time() - start_time
            logger.info(
                f"Embedding model '{self.model_name}' loaded successfully "
                f"(dimension: {self._dimension}, load time: {load_time:.2f}s)"
            )
            
        except Exception as e:
            logger.exception(f"Failed to load embedding model: {e}")
            self._is_loaded = False
    
    @property
    def dimension(self) -> int:
        """Return the embedding vector dimension."""
        return self._dimension or 384  # Default for all-MiniLM-L6-v2
    
    @property
    def loaded(self) -> bool:
        """Return whether the model is loaded."""
        return self._is_loaded
    
    def embed_text(self, text: str) -> list[float]:
        """
        Encode a single text string to an embedding vector.
        
        Args:
            text: Text to encode
            
        Returns:
            Embedding vector as list of floats
            
        Raises:
            RuntimeError: If model is not loaded
        """
        if not self._is_loaded or self._model is None:
            raise RuntimeError("Embedding model not loaded")
        
        embedding = self._model.encode(
            text,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        
        return embedding.tolist()
    
    def embed_batch(
        self,
        texts: list[str],
        batch_size: int = 32
    ) -> list[list[float]]:
        """
        Encode multiple texts efficiently using batching.
        
        Args:
            texts: List of texts to encode
            batch_size: Batch size for encoding
            
        Returns:
            List of embedding vectors
            
        Raises:
            RuntimeError: If model is not loaded
        """
        if not self._is_loaded or self._model is None:
            raise RuntimeError("Embedding model not loaded")
        
        if not texts:
            return []
        
        start_time = time.time()
        
        embeddings = self._model.encode(
            texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        
        elapsed = time.time() - start_time
        logger.info(f"Embedded {len(texts)} texts in {elapsed:.2f}s")
        
        return [emb.tolist() for emb in embeddings]

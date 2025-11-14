"""
Embedding generation service using OpenAI.
"""
from typing import List
from llama_index.embeddings.openai import OpenAIEmbedding
from utils.config import settings

class EmbeddingService:
    """Service for generating embeddings."""
    
    def __init__(self):
        self.embedding_model = None
        self._initialize()
    
    def _initialize(self):
        """Initialize embedding model."""
        if settings.OPENAI_API_KEY:
            try:
                self.embedding_model = OpenAIEmbedding(
                    model="text-embedding-3-large",
                    api_key=settings.OPENAI_API_KEY,
                    dimensions=3072
                )
                print("✓ Embedding service initialized: text-embedding-3-large")
            except Exception as e:
                print(f"✗ Error initializing embedding service: {e}")
        else:
            print("⚠ OpenAI API key not configured")
    
    def get_embedding_model(self):
        """Get the embedding model instance."""
        return self.embedding_model
    
    def is_available(self) -> bool:
        """Check if embedding service is available."""
        return self.embedding_model is not None
    
    def get_embedding(self, text: str) -> List[float]:
        """Get embedding for a single text."""
        if not self.is_available():
            raise ValueError("Embedding service not available")
        
        return self.embedding_model.get_query_embedding(text)
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for multiple texts."""
        if not self.is_available():
            raise ValueError("Embedding service not available")
        
        return self.embedding_model.get_text_embedding_batch(texts)

# Global instance
embedding_service = EmbeddingService()


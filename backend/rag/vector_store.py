"""
Vector database integration for Pinecone and Supabase Vector.
"""
from typing import List, Optional, Dict, Any
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.core.vector_stores import VectorStoreQuery, VectorStoreQueryResult
from llama_index.core.schema import NodeWithScore, TextNode
import pinecone
from utils.config import settings

class VectorStoreManager:
    """Manage vector database connections and operations."""
    
    def __init__(self):
        self.pinecone_index = None
        self.vector_store = None
        self._initialize()
    
    def _initialize(self):
        """Initialize vector database connection."""
        if settings.PINECONE_API_KEY:
            try:
                # Initialize Pinecone
                pinecone.init(
                    api_key=settings.PINECONE_API_KEY,
                    environment=settings.PINECONE_ENVIRONMENT
                )
                
                # Get or create index
                index_name = settings.PINECONE_INDEX_NAME
                if index_name not in pinecone.list_indexes():
                    # Create index if it doesn't exist
                    pinecone.create_index(
                        name=index_name,
                        dimension=3072,  # text-embedding-3-large dimension
                        metric="cosine"
                    )
                
                self.pinecone_index = pinecone.Index(index_name)
                
                # Create LlamaIndex vector store
                self.vector_store = PineconeVectorStore(
                    pinecone_index=self.pinecone_index
                )
                
                print(f"✓ Pinecone vector store initialized: {index_name}")
            except Exception as e:
                print(f"✗ Error initializing Pinecone: {e}")
                self.vector_store = None
        else:
            print("⚠ Pinecone API key not configured")
    
    def get_vector_store(self):
        """Get the vector store instance."""
        return self.vector_store
    
    def is_available(self) -> bool:
        """Check if vector store is available."""
        return self.vector_store is not None
    
    def delete_by_ids(self, ids: List[str]) -> bool:
        """Delete vectors by IDs."""
        if not self.is_available():
            return False
        
        try:
            if self.pinecone_index:
                self.pinecone_index.delete(ids=ids)
            return True
        except Exception as e:
            print(f"Error deleting vectors: {e}")
            return False
    
    def delete_by_metadata_filter(self, filter_dict: Dict[str, Any]) -> bool:
        """Delete vectors by metadata filter."""
        if not self.is_available():
            return False
        
        try:
            if self.pinecone_index:
                self.pinecone_index.delete(filter=filter_dict)
            return True
        except Exception as e:
            print(f"Error deleting vectors by filter: {e}")
            return False

# Global instance
vector_store_manager = VectorStoreManager()


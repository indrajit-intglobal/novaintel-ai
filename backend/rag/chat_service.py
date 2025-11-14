"""
Chat service for RAG-based conversations with RFP documents.
"""
from typing import List, Optional, Dict, Any
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.llms.openai import OpenAI
from rag.retriever import retriever
from utils.config import settings

class ChatService:
    """Service for chatting with RFP documents using RAG."""
    
    def __init__(self):
        self.llm = None
        self._initialize()
    
    def _initialize(self):
        """Initialize LLM."""
        if settings.OPENAI_API_KEY:
            try:
                self.llm = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    model="gpt-4-turbo-preview",
                    temperature=0.1
                )
                print("✓ Chat service initialized: gpt-4-turbo-preview")
            except Exception as e:
                print(f"✗ Error initializing chat service: {e}")
        else:
            print("⚠ OpenAI API key not configured")
    
    def is_available(self) -> bool:
        """Check if chat service is available."""
        return self.llm is not None
    
    def chat(
        self,
        query: str,
        project_id: int,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Chat with RFP document using RAG.
        
        Args:
            query: User query
            project_id: Project ID to filter context
            conversation_history: Previous messages (optional)
            top_k: Number of context chunks to retrieve
        
        Returns:
            dict with 'answer', 'sources', 'context_used'
        """
        if not self.is_available():
            return {
                'success': False,
                'error': 'Chat service not available',
                'answer': None
            }
        
        # Retrieve relevant context
        nodes = retriever.retrieve(query, project_id, top_k)
        
        if not nodes:
            return {
                'success': False,
                'error': 'No relevant context found',
                'answer': None
            }
        
        # Build context from retrieved nodes
        context_parts = []
        sources = []
        
        for i, node in enumerate(nodes, 1):
            text = node.node.get_content()
            metadata = node.node.metadata
            context_parts.append(f"[Context {i}]\n{text}")
            sources.append({
                'chunk_index': i,
                'metadata': metadata,
                'score': node.score if hasattr(node, 'score') else None
            })
        
        context = "\n\n".join(context_parts)
        
        # Build system prompt
        system_prompt = """You are an AI assistant helping with RFP (Request for Proposal) analysis. 
You have access to the RFP document content through the provided context. 
Answer questions based on the context provided. If the answer is not in the context, say so.
Be concise, accurate, and helpful."""
        
        # Build messages
        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=system_prompt)
        ]
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                role = MessageRole.USER if msg.get('role') == 'user' else MessageRole.ASSISTANT
                messages.append(ChatMessage(role=role, content=msg.get('content', '')))
        
        # Add context and query
        user_message = f"""Based on the following RFP document context, answer the question.

Context:
{context}

Question: {query}

Answer:"""
        
        messages.append(ChatMessage(role=MessageRole.USER, content=user_message))
        
        try:
            # Get response from LLM
            response = self.llm.chat(messages)
            answer = response.message.content if hasattr(response, 'message') else str(response)
            
            return {
                'success': True,
                'answer': answer,
                'sources': sources,
                'context_used': len(nodes),
                'query': query
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Error generating response: {str(e)}',
                'answer': None
            }

# Global instance
chat_service = ChatService()


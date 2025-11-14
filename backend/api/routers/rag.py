"""
RAG API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User
from models.project import Project
from models.rfp_document import RFPDocument
from api.schemas.rag import (
    BuildIndexRequest,
    BuildIndexResponse,
    QueryRequest,
    QueryResponse,
    ChatRequest,
    ChatResponse
)
from utils.dependencies import get_current_user
from rag.index_builder import index_builder
from rag.retriever import retriever
from rag.chat_service import chat_service
from pathlib import Path

router = APIRouter()

@router.post("/build-index", response_model=BuildIndexResponse)
async def build_index(
    request: BuildIndexRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Build vector index for an RFP document.
    """
    # Get RFP document
    rfp_doc = db.query(RFPDocument).filter(
        RFPDocument.id == request.rfp_document_id
    ).first()
    
    if not rfp_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFP document not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == rfp_doc.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if file exists
    file_path = Path(rfp_doc.file_path)
    if not file_path.exists():
        return BuildIndexResponse(
            success=False,
            error=f"File not found: {rfp_doc.file_path}"
        )
    
    # Build index
    result = index_builder.build_index_from_file(
        file_path=str(file_path),
        file_type=rfp_doc.file_type,
        project_id=rfp_doc.project_id,
        rfp_document_id=rfp_doc.id,
        db=db
    )
    
    return BuildIndexResponse(**result)

@router.post("/query", response_model=QueryResponse)
async def query_rag(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Query the RAG system to retrieve relevant context.
    """
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == request.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Retrieve nodes
    try:
        nodes = retriever.get_nodes_with_metadata(
            query=request.query,
            project_id=request.project_id,
            top_k=request.top_k
        )
        
        return QueryResponse(
            success=True,
            results=nodes,
            query=request.query
        )
    except Exception as e:
        return QueryResponse(
            success=False,
            results=[],
            query=request.query,
            error=str(e)
        )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_rfp(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chat with RFP document using RAG.
    """
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == request.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Chat with RFP
    result = chat_service.chat(
        query=request.query,
        project_id=request.project_id,
        conversation_history=request.conversation_history,
        top_k=request.top_k
    )
    
    return ChatResponse(**result)


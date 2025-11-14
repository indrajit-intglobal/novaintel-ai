from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from db.database import get_db
from models.user import User
from models.project import Project
from models.proposal import Proposal
from models.insights import Insights
from api.schemas.proposal import (
    ProposalCreate,
    ProposalUpdate,
    ProposalResponse,
    ProposalGenerateRequest,
    ProposalSaveDraftRequest,
    ProposalPreviewResponse
)
from utils.dependencies import get_current_user
from services.proposal_templates import ProposalTemplates
from services.proposal_export import proposal_exporter

router = APIRouter()

@router.post("/save", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
async def save_proposal(
    proposal_data: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save or create a proposal."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == proposal_data.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if proposal already exists
    existing_proposal = db.query(Proposal).filter(
        Proposal.project_id == proposal_data.project_id
    ).first()
    
    if existing_proposal:
        # Update existing proposal
        update_data = proposal_data.dict(exclude_unset=True, exclude={"project_id"})
        for field, value in update_data.items():
            setattr(existing_proposal, field, value)
        db.commit()
        db.refresh(existing_proposal)
        return existing_proposal
    else:
        # Create new proposal
        new_proposal = Proposal(**proposal_data.dict())
        db.add(new_proposal)
        db.commit()
        db.refresh(new_proposal)
        return new_proposal

@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific proposal."""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == proposal.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return proposal

@router.put("/{proposal_id}", response_model=ProposalResponse)
async def update_proposal(
    proposal_id: int,
    proposal_data: ProposalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a proposal."""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == proposal.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update proposal
    update_data = proposal_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(proposal, field, value)
    
    db.commit()
    db.refresh(proposal)
    
    return proposal

@router.post("/generate", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
async def generate_proposal(
    request: ProposalGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new proposal from template, optionally populated with insights.
    """
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == request.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if proposal already exists
    existing_proposal = db.query(Proposal).filter(
        Proposal.project_id == request.project_id
    ).first()
    
    if existing_proposal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal already exists for this project. Use update endpoint instead."
        )
    
    # Get template
    sections = ProposalTemplates.get_template(request.template_type)
    
    # Populate with insights if requested
    if request.use_insights:
        insights = db.query(Insights).filter(
            Insights.project_id == request.project_id
        ).first()
        
        if insights:
            insights_dict = {
                "rfp_summary": insights.executive_summary,
                "challenges": insights.challenges or [],
                "value_propositions": insights.value_propositions or [],
                "matching_case_studies": []
            }
            sections = ProposalTemplates.populate_from_insights(
                request.template_type,
                insights_dict
            )
    
    # Create proposal
    new_proposal = Proposal(
        project_id=request.project_id,
        title=f"{project.client_name} - Proposal",
        sections=sections,
        template_type=request.template_type
    )
    
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)
    
    return new_proposal

@router.post("/save-draft", response_model=ProposalResponse)
async def save_draft(
    request: ProposalSaveDraftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save proposal draft (autosave functionality).
    """
    proposal = db.query(Proposal).filter(Proposal.id == request.proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == proposal.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update sections
    proposal.sections = request.sections
    
    if request.title:
        proposal.title = request.title
    
    proposal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(proposal)
    
    return proposal

@router.get("/{proposal_id}/preview", response_model=ProposalPreviewResponse)
async def preview_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get proposal preview with metadata.
    """
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == proposal.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Calculate word count
    word_count = 0
    sections = proposal.sections or []
    for section in sections:
        content = section.get('content', '') if isinstance(section, dict) else ''
        word_count += len(content.split())
    
    return ProposalPreviewResponse(
        proposal_id=proposal.id,
        title=proposal.title,
        sections=sections,
        template_type=proposal.template_type,
        word_count=word_count,
        section_count=len(sections)
    )

@router.get("/export/pdf")
async def export_pdf(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export proposal as PDF."""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == proposal.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Export to PDF
    try:
        buffer = proposal_exporter.export_pdf(
            title=proposal.title,
            sections=proposal.sections or [],
            project_name=project.name,
            client_name=project.client_name
        )
        
        # Save export
        file_path = proposal_exporter.save_export(buffer, "pdf", proposal_id)
        
        # Update metadata
        proposal.last_exported_at = datetime.utcnow()
        proposal.export_format = "pdf"
        db.commit()
        
        return FileResponse(
            file_path,
            media_type="application/pdf",
            filename=f"{proposal.title.replace(' ', '_')}.pdf"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting PDF: {str(e)}"
        )

@router.get("/export/docx")
async def export_docx(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export proposal as DOCX."""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == proposal.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Export to DOCX
    try:
        buffer = proposal_exporter.export_docx(
            title=proposal.title,
            sections=proposal.sections or [],
            project_name=project.name,
            client_name=project.client_name
        )
        
        # Save export
        file_path = proposal_exporter.save_export(buffer, "docx", proposal_id)
        
        # Update metadata
        proposal.last_exported_at = datetime.utcnow()
        proposal.export_format = "docx"
        db.commit()
        
        return FileResponse(
            file_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"{proposal.title.replace(' ', '_')}.docx"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting DOCX: {str(e)}"
        )

@router.get("/export/pptx")
async def export_pptx(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export proposal as PowerPoint."""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == proposal.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Export to PPTX
    try:
        buffer = proposal_exporter.export_pptx(
            title=proposal.title,
            sections=proposal.sections or [],
            project_name=project.name,
            client_name=project.client_name
        )
        
        # Save export
        file_path = proposal_exporter.save_export(buffer, "pptx", proposal_id)
        
        # Update metadata
        proposal.last_exported_at = datetime.utcnow()
        proposal.export_format = "pptx"
        db.commit()
        
        return FileResponse(
            file_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=f"{proposal.title.replace(' ', '_')}.pptx"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting PPTX: {str(e)}"
        )


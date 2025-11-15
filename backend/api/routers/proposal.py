from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
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
    ProposalPreviewResponse,
    RegenerateSectionRequest
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
        update_data = proposal_data.model_dump(exclude_unset=True, exclude={"project_id"})
        for field, value in update_data.items():
            setattr(existing_proposal, field, value)
        db.commit()
        db.refresh(existing_proposal)
        return existing_proposal
    else:
        # Create new proposal
        new_proposal = Proposal(**proposal_data.model_dump())
        db.add(new_proposal)
        db.commit()
        db.refresh(new_proposal)
        return new_proposal

@router.get("/by-project/{project_id}", response_model=ProposalResponse)
async def get_proposal_by_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get proposal for a specific project."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get proposal for this project
    proposal = db.query(Proposal).filter(
        Proposal.project_id == project_id
    ).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found for this project"
        )
    
    return proposal

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
    update_data = proposal_data.model_dump(exclude_unset=True)
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
    
    # Get template
    sections = ProposalTemplates.get_template(request.template_type)
    
    # Populate with insights if requested
    if request.use_insights:
        insights = db.query(Insights).filter(
            Insights.project_id == request.project_id
        ).first()
        
        if insights:
            # Get matching case studies if available
            matching_case_studies = []
            if hasattr(insights, 'matching_case_studies') and insights.matching_case_studies:
                matching_case_studies = insights.matching_case_studies
            elif insights.challenges:
                # Try to get case studies from database based on challenges
                from models.case_study import CaseStudy
                all_case_studies = db.query(CaseStudy).limit(5).all()
                matching_case_studies = [
                    {
                        "id": cs.id,
                        "title": cs.title,
                        "industry": cs.industry,
                        "impact": cs.impact,
                        "description": cs.description
                    }
                    for cs in all_case_studies
                ]
            
            insights_dict = {
                "rfp_summary": insights.executive_summary or "",
                "challenges": insights.challenges or [],
                "value_propositions": insights.value_propositions or [],
                "matching_case_studies": matching_case_studies
            }
            # Use AI to generate full content
            sections = ProposalTemplates.populate_from_insights(
                request.template_type,
                insights_dict,
                use_ai=True
            )
    
    if existing_proposal:
        # Update existing proposal with new AI-generated content
        existing_proposal.sections = sections
        existing_proposal.template_type = request.template_type
        existing_proposal.title = f"{project.client_name} - Proposal"
        existing_proposal.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_proposal)
        return existing_proposal
    else:
        # Create new proposal
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

@router.post("/regenerate-section", response_model=Dict[str, Any])
async def regenerate_section(
    request: RegenerateSectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Regenerate a specific section's content using AI based on insights.
    """
    # Get proposal
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
    
    # Get insights
    insights = db.query(Insights).filter(
        Insights.project_id == proposal.project_id
    ).first()
    
    if not insights:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insights not found. Please run the workflow first."
        )
    
    # Get matching case studies
    matching_case_studies = []
    if hasattr(insights, 'matching_case_studies') and insights.matching_case_studies:
        matching_case_studies = insights.matching_case_studies
    else:
        from models.case_study import CaseStudy
        all_case_studies = db.query(CaseStudy).limit(5).all()
        matching_case_studies = [
            {
                "id": cs.id,
                "title": cs.title,
                "industry": cs.industry,
                "impact": cs.impact,
                "description": cs.description
            }
            for cs in all_case_studies
        ]
    
    # Generate new content for the section
    try:
        from services.proposal_templates import ProposalTemplates
        
        insights_dict = {
            "rfp_summary": insights.executive_summary or "",
            "challenges": insights.challenges or [],
            "value_propositions": insights.value_propositions or [],
            "matching_case_studies": matching_case_studies
        }
        
        new_content = ProposalTemplates._generate_section_content_ai(
            section_title=request.section_title,
            rfp_summary=insights_dict["rfp_summary"],
            challenges=insights_dict["challenges"],
            value_propositions=insights_dict["value_propositions"],
            case_studies=insights_dict["matching_case_studies"]
        )
        
        # Update the section in the proposal
        sections = proposal.sections or []
        updated_sections = []
        section_found = False
        
        for section in sections:
            section_id = section.get("id") if isinstance(section, dict) else None
            if section_id == request.section_id:
                # Update this section
                updated_section = section.copy() if isinstance(section, dict) else {"id": request.section_id, "title": request.section_title}
                updated_section["content"] = new_content
                updated_sections.append(updated_section)
                section_found = True
            else:
                updated_sections.append(section)
        
        if not section_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found in proposal"
            )
        
        # Save updated sections
        proposal.sections = updated_sections
        proposal.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(proposal)
        
        return {
            "success": True,
            "section_id": request.section_id,
            "content": new_content,
            "message": "Section regenerated successfully"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error regenerating section: {str(e)}"
        )

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


"""
Multi-agent workflow API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User
from models.project import Project
from models.rfp_document import RFPDocument
from api.schemas.workflow import (
    RunWorkflowRequest,
    RunWorkflowResponse,
    GetStateRequest,
    GetStateResponse
)
from utils.dependencies import get_current_user
from workflows.workflow_manager import workflow_manager

router = APIRouter()

@router.post("/run-all", response_model=RunWorkflowResponse)
async def run_all_agents(
    request: RunWorkflowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run the complete multi-agent workflow.
    Executes all agents in sequence:
    1. RFP Analyzer
    2. Challenge Extractor
    3. Discovery Question Agent
    4. Value Proposition Agent
    5. Case Study Matcher
    6. Proposal Builder
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
    
    # Verify RFP document belongs to project
    rfp_doc = db.query(RFPDocument).filter(
        RFPDocument.id == request.rfp_document_id,
        RFPDocument.project_id == request.project_id
    ).first()
    
    if not rfp_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFP document not found"
        )
    
    # Run workflow
    result = workflow_manager.run_workflow(
        project_id=request.project_id,
        rfp_document_id=request.rfp_document_id,
        db=db
    )
    
    return RunWorkflowResponse(**result)

@router.post("/get-state", response_model=GetStateResponse)
async def get_workflow_state(
    request: GetStateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get workflow state by state_id.
    Useful for debugging and monitoring workflow execution.
    """
    state = workflow_manager.get_state(request.state_id)
    
    if not state:
        return GetStateResponse(
            success=False,
            error="State not found. It may have expired or never existed."
        )
    
    return GetStateResponse(
        success=True,
        state=state
    )

@router.get("/debug")
async def debug_workflow(
    state_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Debug endpoint to inspect workflow state.
    Returns detailed state information including errors and execution log.
    """
    state = workflow_manager.get_state(state_id)
    
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="State not found"
        )
    
    return {
        "state_id": state_id,
        "current_step": state.get("current_step"),
        "errors": state.get("errors", []),
        "warnings": state.get("warnings", []),
        "execution_log": state.get("execution_log", []),
        "has_rfp_summary": state.get("rfp_summary") is not None,
        "has_challenges": state.get("challenges") is not None,
        "has_discovery_questions": state.get("discovery_questions") is not None,
        "has_value_propositions": state.get("value_propositions") is not None,
        "has_case_studies": state.get("matching_case_studies") is not None,
        "has_proposal": state.get("proposal_draft") is not None,
        "full_state": state
    }


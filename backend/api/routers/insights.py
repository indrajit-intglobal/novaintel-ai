from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db
from models.user import User
from models.project import Project
from models.insights import Insights
from api.schemas.insights import InsightsResponse
from utils.dependencies import get_current_user

router = APIRouter()

class InsightsStatusResponse(BaseModel):
    exists: bool
    project_id: int
    message: str

@router.get("/get", response_model=InsightsResponse)
async def get_insights(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get insights for a project.
    Returns 404 if insights haven't been generated yet.
    Run /agents/run-all first to generate insights.
    """
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
    
    # Get insights
    insights = db.query(Insights).filter(Insights.project_id == project_id).first()
    
    if not insights:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insights not found for this project. Please run the agents workflow first using /agents/run-all"
        )
    
    return insights

@router.get("/status", response_model=InsightsStatusResponse)
async def check_insights_status(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if insights exist for a project.
    Returns status without requiring insights to exist.
    """
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
    
    # Check if insights exist
    insights = db.query(Insights).filter(Insights.project_id == project_id).first()
    
    if insights:
        return InsightsStatusResponse(
            exists=True,
            project_id=project_id,
            message="Insights are available. Use /insights/get to retrieve them."
        )
    else:
        return InsightsStatusResponse(
            exists=False,
            project_id=project_id,
            message="Insights not generated yet. Run /agents/run-all to generate insights."
        )


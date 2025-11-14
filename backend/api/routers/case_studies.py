from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import get_db
from models.user import User
from models.case_study import CaseStudy
from api.schemas.case_study import CaseStudyCreate, CaseStudyUpdate, CaseStudyResponse
from utils.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[CaseStudyResponse])
async def list_case_studies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    industry: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all case studies, optionally filtered by industry."""
    query = db.query(CaseStudy)
    
    if industry:
        query = query.filter(CaseStudy.industry == industry)
    
    case_studies = query.offset(skip).limit(limit).all()
    return case_studies

@router.post("", response_model=CaseStudyResponse, status_code=status.HTTP_201_CREATED)
async def create_case_study(
    case_study_data: CaseStudyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new case study."""
    new_case_study = CaseStudy(**case_study_data.dict())
    
    db.add(new_case_study)
    db.commit()
    db.refresh(new_case_study)
    
    return new_case_study

@router.get("/{case_study_id}", response_model=CaseStudyResponse)
async def get_case_study(
    case_study_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific case study."""
    case_study = db.query(CaseStudy).filter(CaseStudy.id == case_study_id).first()
    
    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found"
        )
    
    return case_study

@router.put("/{case_study_id}", response_model=CaseStudyResponse)
async def update_case_study(
    case_study_id: int,
    case_study_data: CaseStudyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a case study."""
    case_study = db.query(CaseStudy).filter(CaseStudy.id == case_study_id).first()
    
    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found"
        )
    
    # Update fields
    update_data = case_study_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case_study, field, value)
    
    db.commit()
    db.refresh(case_study)
    
    return case_study

@router.delete("/{case_study_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case_study(
    case_study_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a case study."""
    case_study = db.query(CaseStudy).filter(CaseStudy.id == case_study_id).first()
    
    if not case_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case study not found"
        )
    
    db.delete(case_study)
    db.commit()
    
    return None


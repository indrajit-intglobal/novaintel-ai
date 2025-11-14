from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class ProposalSection(BaseModel):
    id: int
    title: str
    content: str
    order: Optional[int] = 0
    required: Optional[bool] = False

class ProposalCreate(BaseModel):
    project_id: int
    title: Optional[str] = "Proposal"
    sections: Optional[List[Dict]] = None
    template_type: Optional[str] = "full"

class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    sections: Optional[List[Dict]] = None
    template_type: Optional[str] = None

class ProposalGenerateRequest(BaseModel):
    project_id: int
    template_type: Optional[str] = "full"
    use_insights: Optional[bool] = True

class ProposalSaveDraftRequest(BaseModel):
    proposal_id: int
    sections: List[Dict]
    title: Optional[str] = None

class ProposalResponse(BaseModel):
    id: int
    project_id: int
    title: str
    sections: Optional[List[Dict]]
    template_type: str
    last_exported_at: Optional[datetime]
    export_format: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProposalPreviewResponse(BaseModel):
    proposal_id: int
    title: str
    sections: List[Dict]
    template_type: str
    word_count: Optional[int] = None
    section_count: Optional[int] = None


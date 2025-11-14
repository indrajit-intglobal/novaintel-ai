from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class InsightsResponse(BaseModel):
    id: int
    project_id: int
    executive_summary: Optional[str]
    challenges: Optional[List[Dict]]
    value_propositions: Optional[List[str]]
    discovery_questions: Optional[Dict[str, List[str]]]
    tags: Optional[List[str]]
    ai_model_used: Optional[str]
    analysis_timestamp: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


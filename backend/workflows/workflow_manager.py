"""
Workflow manager for executing and managing multi-agent workflows.
"""
from typing import Dict, Any, Optional
from workflows.graph import workflow_graph
from workflows.state import create_initial_state, WorkflowState
from db.database import get_db
from models.rfp_document import RFPDocument
from models.project import Project
from models.insights import Insights
from sqlalchemy.orm import Session

class WorkflowManager:
    """Manages workflow execution and state."""
    
    def __init__(self):
        self.workflow = workflow_graph
        self.active_states: Dict[str, WorkflowState] = {}
    
    def run_workflow(
        self,
        project_id: int,
        rfp_document_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Run the complete workflow.
        
        Args:
            project_id: Project ID
            rfp_document_id: RFP document ID
            db: Database session
        
        Returns:
            dict with workflow results
        """
        # Get RFP document
        rfp_doc = db.query(RFPDocument).filter(
            RFPDocument.id == rfp_document_id
        ).first()
        
        if not rfp_doc:
            return {
                "success": False,
                "error": "RFP document not found"
            }
        
        # Get RFP text
        rfp_text = rfp_doc.extracted_text
        if not rfp_text:
            return {
                "success": False,
                "error": "RFP document has no extracted text. Please build index first."
            }
        
        # Create initial state
        initial_state = create_initial_state(
            project_id=project_id,
            rfp_document_id=rfp_document_id,
            rfp_text=rfp_text,
            retrieved_context=None
        )
        
        # Store state
        state_id = f"{project_id}_{rfp_document_id}"
        self.active_states[state_id] = initial_state
        
        try:
            # Run workflow
            final_state = self.workflow.invoke(initial_state)
            
            # Update stored state
            self.active_states[state_id] = final_state
            
            # Save insights to database
            self._save_insights(final_state, db)
            
            return {
                "success": True,
                "state_id": state_id,
                "state": final_state,
                "summary": {
                    "rfp_summary": final_state.get("rfp_summary"),
                    "challenges_count": len(final_state.get("challenges", [])),
                    "value_propositions_count": len(final_state.get("value_propositions", [])),
                    "case_studies_count": len(final_state.get("matching_case_studies", [])),
                    "proposal_created": final_state.get("proposal_draft") is not None
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "state_id": state_id
            }
    
    def get_state(self, state_id: str) -> Optional[WorkflowState]:
        """Get workflow state by ID."""
        return self.active_states.get(state_id)
    
    def _save_insights(self, state: WorkflowState, db: Session):
        """Save workflow results to Insights table."""
        try:
            project_id = state["project_id"]
            
            # Check if insights already exist
            insights = db.query(Insights).filter(
                Insights.project_id == project_id
            ).first()
            
            if not insights:
                insights = Insights(project_id=project_id)
                db.add(insights)
            
            # Update insights
            insights.executive_summary = state.get("rfp_summary")
            insights.challenges = state.get("challenges")
            insights.value_propositions = state.get("value_propositions")
            insights.discovery_questions = state.get("discovery_questions")
            insights.tags = state.get("business_objectives")
            
            db.commit()
        
        except Exception as e:
            print(f"Error saving insights: {e}")
            db.rollback()

# Global instance
workflow_manager = WorkflowManager()


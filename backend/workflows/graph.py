"""
LangGraph workflow for multi-agent presales pipeline.
"""
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from workflows.state import WorkflowState, create_initial_state
from workflows.agents import (
    rfp_analyzer_agent,
    challenge_extractor_agent,
    discovery_question_agent,
    value_proposition_agent,
    case_study_matcher_agent,
    proposal_builder_agent
)

def rfp_analyzer_node(state: WorkflowState) -> Dict[str, Any]:
    """RFP Analyzer Agent node."""
    updates = {"current_step": "rfp_analyzer"}
    
    try:
        # Get RFP text if not in state
        rfp_text = state.get("rfp_text")
        if not rfp_text:
            # Try to get from state context (passed from workflow manager)
            rfp_text = state.get("rfp_text", "")
        
        # Run analyzer
        result = rfp_analyzer_agent.analyze(
            rfp_text=rfp_text,
            retrieved_context=state.get("retrieved_context"),
            project_id=state["project_id"]
        )
        
        if result.get("error"):
            updates["errors"] = [f"RFP Analyzer: {result['error']}"]
        else:
            updates.update({
                "rfp_summary": result.get("rfp_summary"),
                "context_overview": result.get("context_overview"),
                "business_objectives": result.get("business_objectives"),
                "project_scope": result.get("project_scope"),
                "execution_log": [{
                    "step": "rfp_analyzer",
                    "status": "success",
                    "output": "RFP analyzed successfully"
                }]
            })
    except Exception as e:
        updates["errors"] = [f"RFP Analyzer error: {str(e)}"]
        updates["execution_log"] = [{
            "step": "rfp_analyzer",
            "status": "error",
            "error": str(e)
        }]
    
    return updates

def challenge_extractor_node(state: WorkflowState) -> Dict[str, Any]:
    """Challenge Extractor Agent node."""
    updates = {"current_step": "challenge_extractor"}
    
    try:
        result = challenge_extractor_agent.extract_challenges(
            rfp_summary=state.get("rfp_summary", ""),
            business_objectives=state.get("business_objectives", [])
        )
        
        if result.get("error"):
            updates["errors"] = [f"Challenge Extractor: {result['error']}"]
        else:
            updates.update({
                "challenges": result.get("challenges", []),
                "execution_log": [{
                    "step": "challenge_extractor",
                    "status": "success",
                    "challenges_count": len(result.get("challenges", []))
                }]
            })
    except Exception as e:
        updates["errors"] = [f"Challenge Extractor error: {str(e)}"]
        updates["execution_log"] = [{
            "step": "challenge_extractor",
            "status": "error",
            "error": str(e)
        }]
    
    return updates

def discovery_question_node(state: WorkflowState) -> Dict[str, Any]:
    """Discovery Question Agent node."""
    updates = {"current_step": "discovery_question"}
    
    try:
        result = discovery_question_agent.generate_questions(
            challenges=state.get("challenges", [])
        )
        
        if result.get("error"):
            updates["errors"] = [f"Discovery Question: {result['error']}"]
        else:
            updates.update({
                "discovery_questions": result.get("discovery_questions", {}),
                "execution_log": [{
                    "step": "discovery_question",
                    "status": "success",
                    "questions_count": sum(len(q) for q in result.get("discovery_questions", {}).values())
                }]
            })
    except Exception as e:
        updates["errors"] = [f"Discovery Question error: {str(e)}"]
        updates["execution_log"] = [{
            "step": "discovery_question",
            "status": "error",
            "error": str(e)
        }]
    
    return updates

def value_proposition_node(state: WorkflowState) -> Dict[str, Any]:
    """Value Proposition Agent node."""
    updates = {"current_step": "value_proposition"}
    
    try:
        result = value_proposition_agent.generate_value_propositions(
            challenges=state.get("challenges", []),
            rfp_summary=state.get("rfp_summary")
        )
        
        if result.get("error"):
            updates["errors"] = [f"Value Proposition: {result['error']}"]
        else:
            updates.update({
                "value_propositions": result.get("value_propositions", []),
                "execution_log": [{
                    "step": "value_proposition",
                    "status": "success",
                    "value_props_count": len(result.get("value_propositions", []))
                }]
            })
    except Exception as e:
        updates["errors"] = [f"Value Proposition error: {str(e)}"]
        updates["execution_log"] = [{
            "step": "value_proposition",
            "status": "error",
            "error": str(e)
        }]
    
    return updates

def case_study_matcher_node(state: WorkflowState) -> Dict[str, Any]:
    """Case Study Matcher Agent node."""
    updates = {"current_step": "case_study_matcher"}
    
    try:
        # Get db from state if available, otherwise create new session
        from db.database import SessionLocal
        db = SessionLocal()
        try:
            result = case_study_matcher_agent.match_case_studies(
                challenges=state.get("challenges", []),
                db=db,
                top_k=3
            )
            
            if result.get("error"):
                updates["errors"] = [f"Case Study Matcher: {result['error']}"]
            else:
                updates.update({
                    "matching_case_studies": result.get("matching_case_studies", []),
                    "execution_log": [{
                        "step": "case_study_matcher",
                        "status": "success",
                        "case_studies_count": len(result.get("matching_case_studies", []))
                    }]
                })
        finally:
            db.close()
    except Exception as e:
        updates["errors"] = [f"Case Study Matcher error: {str(e)}"]
        updates["execution_log"] = [{
            "step": "case_study_matcher",
            "status": "error",
            "error": str(e)
        }]
    
    return updates

def proposal_builder_node(state: WorkflowState) -> Dict[str, Any]:
    """Proposal Builder Agent node."""
    updates = {"current_step": "proposal_builder"}
    
    try:
        result = proposal_builder_agent.build_proposal(
            rfp_summary=state.get("rfp_summary", ""),
            challenges=state.get("challenges", []),
            value_propositions=state.get("value_propositions", []),
            case_studies=state.get("matching_case_studies", [])
        )
        
        if result.get("error"):
            updates["errors"] = [f"Proposal Builder: {result['error']}"]
        else:
            updates.update({
                "proposal_draft": result.get("proposal_draft"),
                "execution_log": [{
                    "step": "proposal_builder",
                    "status": "success",
                    "output": "Proposal draft created"
                }]
            })
    except Exception as e:
        updates["errors"] = [f"Proposal Builder error: {str(e)}"]
        updates["execution_log"] = [{
            "step": "proposal_builder",
            "status": "error",
            "error": str(e)
        }]
    
    return updates

def create_workflow_graph() -> StateGraph:
    """Create the LangGraph workflow."""
    workflow = StateGraph(WorkflowState)
    
    # Add nodes
    workflow.add_node("rfp_analyzer", rfp_analyzer_node)
    workflow.add_node("challenge_extractor", challenge_extractor_node)
    workflow.add_node("discovery_question", discovery_question_node)
    workflow.add_node("value_proposition", value_proposition_node)
    workflow.add_node("case_study_matcher", case_study_matcher_node)
    workflow.add_node("proposal_builder", proposal_builder_node)
    
    # Define edges (workflow order)
    workflow.set_entry_point("rfp_analyzer")
    workflow.add_edge("rfp_analyzer", "challenge_extractor")
    workflow.add_edge("challenge_extractor", "discovery_question")
    workflow.add_edge("challenge_extractor", "value_proposition")
    workflow.add_edge("challenge_extractor", "case_study_matcher")
    workflow.add_edge("discovery_question", "proposal_builder")
    workflow.add_edge("value_proposition", "proposal_builder")
    workflow.add_edge("case_study_matcher", "proposal_builder")
    workflow.add_edge("proposal_builder", END)
    
    return workflow.compile()

# Global workflow instance
workflow_graph = create_workflow_graph()


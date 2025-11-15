"""
Proposal Builder Agent - Drafts complete proposal sections.
"""
from typing import Dict, Any, List
from langchain.prompts import ChatPromptTemplate
from utils.config import settings
from utils.llm_factory import get_llm

class ProposalBuilderAgent:
    """Agent that builds proposal drafts."""
    
    def __init__(self):
        self.llm = None
        self._initialize()
    
    def _initialize(self):
        """Initialize the LLM."""
        try:
            self.llm = get_llm(provider=settings.LLM_PROVIDER, temperature=0.2)
            print(f"✓ Proposal Builder Agent initialized with {settings.LLM_PROVIDER}")
        except Exception as e:
            print(f"Error initializing Proposal Builder Agent: {e}")
    
    def build_proposal(
        self,
        rfp_summary: str,
        challenges: List[Dict[str, Any]],
        value_propositions: List[str],
        case_studies: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Build proposal draft with all sections.
        
        Args:
            rfp_summary: RFP summary
            challenges: List of challenges
            value_propositions: List of value propositions
            case_studies: List of matched case studies
        
        Returns:
            dict with proposal_draft sections
        """
        if not self.llm:
            return {
                "proposal_draft": None,
                "error": "LLM not initialized"
            }
        
        challenges_text = ""
        if challenges:
            challenges_text = "\n".join([
                f"- {ch.get('description', '')}"
                for ch in challenges
            ])
        
        value_props_text = "\n".join([f"- {vp}" for vp in value_propositions]) if value_propositions else "None"
        
        case_studies_text = ""
        if case_studies:
            case_studies_text = "\n".join([
                f"- {cs.get('title', '')}: {cs.get('impact', '')}"
                for cs in case_studies
            ])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert proposal writer. Create a comprehensive proposal draft with:
1. Executive Summary
2. Understanding Client Challenges
3. Proposed Solution
4. Benefits & Value Propositions
5. Case Studies & Success Stories
6. Implementation Approach

Write professionally, clearly, and focus on client value."""),
            ("user", """Create a proposal draft based on:

RFP Summary:
{rfp_summary}

Client Challenges:
{challenges}

Value Propositions:
{value_propositions}

Relevant Case Studies:
{case_studies}

Provide proposal in JSON format:
{{
    "executive_summary": "Executive summary text",
    "client_challenges": "Section on understanding challenges",
    "proposed_solution": "Our solution approach",
    "benefits_value": "Benefits and value propositions",
    "case_studies": "Case studies section",
    "implementation_approach": "How we will implement"
}}""")
        ])
        
        try:
            chain = prompt | self.llm
            response = chain.invoke({
                "rfp_summary": rfp_summary or "No summary available",
                "challenges": challenges_text or "No challenges identified",
                "value_propositions": value_props_text,
                "case_studies": case_studies_text or "No case studies available"
            })
            
            # Parse JSON response
            import json
            import re
            
            content = response.content
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            
            if json_match:
                result = json.loads(json_match.group())
                proposal_draft = result
            else:
                # Fallback: create basic structure
                proposal_draft = {
                    "executive_summary": content[:500] if content else "Executive summary",
                    "client_challenges": "Client challenges section",
                    "proposed_solution": "Proposed solution",
                    "benefits_value": value_props_text,
                    "case_studies": case_studies_text or "Case studies",
                    "implementation_approach": "Implementation approach"
                }
            
            return {
                "proposal_draft": proposal_draft,
                "error": None
            }
        
        except Exception as e:
            return {
                "proposal_draft": None,
                "error": str(e)
            }

# Global instance
proposal_builder_agent = ProposalBuilderAgent()


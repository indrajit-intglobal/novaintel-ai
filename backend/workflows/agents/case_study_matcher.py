"""
Case Study Matcher Agent - Retrieves similar case studies from database.
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from db.database import get_db
from models.case_study import CaseStudy
from rag.retriever import retriever

class CaseStudyMatcherAgent:
    """Agent that matches case studies to challenges."""
    
    def __init__(self):
        pass
    
    def match_case_studies(
        self,
        challenges: List[Dict[str, Any]],
        db: Session,
        top_k: int = 3
    ) -> Dict[str, Any]:
        """
        Match case studies based on challenges.
        
        Args:
            challenges: List of challenges
            db: Database session
            top_k: Number of case studies to return
        
        Returns:
            dict with matching_case_studies list
        """
        try:
            # Handle None or empty challenges
            if not challenges:
                return {
                    "matching_case_studies": [],
                    "error": None
                }
            
            # Extract key terms from challenges
            challenge_texts = [
                ch.get('description', '') + ' ' + ch.get('category', '')
                for ch in challenges
            ]
            query = ' '.join(challenge_texts[:3])  # Use first 3 challenges
            
            # Get all case studies from database
            all_case_studies = db.query(CaseStudy).all()
            
            if not all_case_studies:
                return {
                    "matching_case_studies": [],
                    "error": None
                }
            
            # Simple matching based on industry and keywords
            # In production, use vector similarity search
            matched = []
            
            # Extract industries from challenges
            industries = set()
            for ch in challenges:
                category = ch.get('category', '').lower()
                if 'bank' in category or 'financial' in category:
                    industries.add('BFSI')
                elif 'retail' in category:
                    industries.add('Retail')
                elif 'health' in category:
                    industries.add('Healthcare')
                elif 'manufactur' in category:
                    industries.add('Manufacturing')
            
            # Match by industry first
            for case_study in all_case_studies:
                if case_study.industry in industries:
                    matched.append({
                        "id": case_study.id,
                        "title": case_study.title,
                        "industry": case_study.industry,
                        "impact": case_study.impact,
                        "description": case_study.description,
                        "relevance_score": 0.9
                    })
            
            # If not enough matches, add others
            if len(matched) < top_k:
                for case_study in all_case_studies:
                    if not any(m['id'] == case_study.id for m in matched):
                        matched.append({
                            "id": case_study.id,
                            "title": case_study.title,
                            "industry": case_study.industry,
                            "impact": case_study.impact,
                            "description": case_study.description,
                            "relevance_score": 0.5
                        })
            
            # Sort by relevance and return top_k
            matched.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            return {
                "matching_case_studies": matched[:top_k],
                "error": None
            }
        
        except Exception as e:
            return {
                "matching_case_studies": [],
                "error": str(e)
            }

# Global instance
case_study_matcher_agent = CaseStudyMatcherAgent()


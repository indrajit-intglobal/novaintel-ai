"""
Proposal templates for different proposal types.
"""
from typing import List, Dict, Any

class ProposalTemplates:
    """Proposal templates with predefined sections."""
    
    EXECUTIVE_TEMPLATE = [
        {
            "id": 1,
            "title": "Executive Summary",
            "content": "",
            "order": 1,
            "required": True
        },
        {
            "id": 2,
            "title": "Client Challenges",
            "content": "",
            "order": 2,
            "required": True
        },
        {
            "id": 3,
            "title": "Proposed Solution",
            "content": "",
            "order": 3,
            "required": True
        },
        {
            "id": 4,
            "title": "Key Benefits",
            "content": "",
            "order": 4,
            "required": True
        },
        {
            "id": 5,
            "title": "Next Steps",
            "content": "",
            "order": 5,
            "required": True
        }
    ]
    
    FULL_TEMPLATE = [
        {
            "id": 1,
            "title": "Introduction",
            "content": "",
            "order": 1,
            "required": True
        },
        {
            "id": 2,
            "title": "Understanding Client Challenges",
            "content": "",
            "order": 2,
            "required": True
        },
        {
            "id": 3,
            "title": "Proposed Solution",
            "content": "",
            "order": 3,
            "required": True
        },
        {
            "id": 4,
            "title": "Value Propositions",
            "content": "",
            "order": 4,
            "required": True
        },
        {
            "id": 5,
            "title": "Case Studies & Success Stories",
            "content": "",
            "order": 5,
            "required": False
        },
        {
            "id": 6,
            "title": "Benefits & ROI",
            "content": "",
            "order": 6,
            "required": True
        },
        {
            "id": 7,
            "title": "Implementation Approach",
            "content": "",
            "order": 7,
            "required": False
        },
        {
            "id": 8,
            "title": "Next Steps",
            "content": "",
            "order": 8,
            "required": True
        }
    ]
    
    ONE_PAGE_TEMPLATE = [
        {
            "id": 1,
            "title": "Overview",
            "content": "",
            "order": 1,
            "required": True
        },
        {
            "id": 2,
            "title": "Solution & Benefits",
            "content": "",
            "order": 2,
            "required": True
        },
        {
            "id": 3,
            "title": "Why Choose Us",
            "content": "",
            "order": 3,
            "required": True
        },
        {
            "id": 4,
            "title": "Call to Action",
            "content": "",
            "order": 4,
            "required": True
        }
    ]
    
    @classmethod
    def get_template(cls, template_type: str) -> List[Dict[str, Any]]:
        """
        Get template by type.
        
        Args:
            template_type: "executive", "full", or "one-page"
        
        Returns:
            List of section dictionaries
        """
        templates = {
            "executive": cls.EXECUTIVE_TEMPLATE,
            "full": cls.FULL_TEMPLATE,
            "one-page": cls.ONE_PAGE_TEMPLATE
        }
        
        return templates.get(template_type.lower(), cls.FULL_TEMPLATE).copy()
    
    @classmethod
    def populate_from_insights(
        cls,
        template_type: str,
        insights: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Populate template with insights data.
        
        Args:
            template_type: Template type
            insights: Insights dictionary with rfp_summary, challenges, etc.
        
        Returns:
            Populated sections
        """
        sections = cls.get_template(template_type)
        
        # Populate with insights
        for section in sections:
            title_lower = section["title"].lower()
            
            if "summary" in title_lower or "overview" in title_lower or "introduction" in title_lower:
                section["content"] = insights.get("rfp_summary", "") or insights.get("executive_summary", "")
            
            elif "challenge" in title_lower:
                challenges = insights.get("challenges", [])
                if challenges:
                    content = "Key challenges identified:\n\n"
                    for i, ch in enumerate(challenges[:5], 1):
                        desc = ch.get("description", "") if isinstance(ch, dict) else str(ch)
                        content += f"{i}. {desc}\n"
                    section["content"] = content
            
            elif "solution" in title_lower:
                section["content"] = insights.get("proposed_solution", "Our comprehensive solution addresses your key challenges...")
            
            elif "value" in title_lower or "benefit" in title_lower:
                value_props = insights.get("value_propositions", [])
                if value_props:
                    content = "\n".join([f"• {vp}" for vp in value_props[:5]])
                    section["content"] = content
                else:
                    section["content"] = "Significant value through improved efficiency and ROI."
            
            elif "case study" in title_lower or "success" in title_lower:
                case_studies = insights.get("matching_case_studies", [])
                if case_studies:
                    content = ""
                    for cs in case_studies[:3]:
                        title = cs.get("title", "") if isinstance(cs, dict) else str(cs)
                        impact = cs.get("impact", "") if isinstance(cs, dict) else ""
                        content += f"• {title}: {impact}\n"
                    section["content"] = content
                else:
                    section["content"] = "Relevant case studies available upon request."
            
            elif "next step" in title_lower or "action" in title_lower:
                section["content"] = "We look forward to discussing how we can help achieve your objectives. Please contact us to schedule a detailed discussion."
        
        return sections


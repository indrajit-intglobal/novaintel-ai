"""
Proposal templates for different proposal types.
"""
from typing import List, Dict, Any
from workflows.agents.proposal_builder import proposal_builder_agent

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
        insights: Dict[str, Any],
        use_ai: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Populate template with insights data, optionally using AI for full content generation.
        
        Args:
            template_type: Template type
            insights: Insights dictionary with rfp_summary, challenges, etc.
            use_ai: If True, use AI to generate full content for each section
        
        Returns:
            Populated sections
        """
        sections = cls.get_template(template_type)
        
        if use_ai and proposal_builder_agent.llm:
            # Use AI to generate full content for each section
            rfp_summary = insights.get("rfp_summary", "") or insights.get("executive_summary", "")
            challenges = insights.get("challenges", [])
            value_propositions = insights.get("value_propositions", [])
            case_studies = insights.get("matching_case_studies", [])
            
            # Generate content for each section using AI
            for section in sections:
                try:
                    section_content = cls._generate_section_content_ai(
                        section_title=section["title"],
                        rfp_summary=rfp_summary,
                        challenges=challenges,
                        value_propositions=value_propositions,
                        case_studies=case_studies
                    )
                    section["content"] = section_content
                except Exception as e:
                    print(f"Error generating AI content for section {section['title']}: {e}")
                    # Fallback to basic population
                    section["content"] = cls._populate_section_basic(section, insights)
        else:
            # Basic population without AI
            for section in sections:
                section["content"] = cls._populate_section_basic(section, insights)
        
        return sections
    
    @classmethod
    def _populate_section_basic(cls, section: Dict[str, Any], insights: Dict[str, Any]) -> str:
        """Basic section population without AI."""
        title_lower = section["title"].lower()
        
        if "summary" in title_lower or "overview" in title_lower or "introduction" in title_lower:
            return insights.get("rfp_summary", "") or insights.get("executive_summary", "")
        
        elif "challenge" in title_lower:
            challenges = insights.get("challenges", [])
            if challenges:
                content = "Key challenges identified:\n\n"
                for i, ch in enumerate(challenges[:5], 1):
                    desc = ch.get("description", "") if isinstance(ch, dict) else str(ch)
                    content += f"{i}. {desc}\n"
                return content
            return ""
        
        elif "solution" in title_lower:
            return insights.get("proposed_solution", "Our comprehensive solution addresses your key challenges...")
        
        elif "value" in title_lower or "benefit" in title_lower:
            value_props = insights.get("value_propositions", [])
            if value_props:
                return "\n".join([f"• {vp}" for vp in value_props[:5]])
            return "Significant value through improved efficiency and ROI."
        
        elif "case study" in title_lower or "success" in title_lower:
            case_studies = insights.get("matching_case_studies", [])
            if case_studies:
                content = ""
                for cs in case_studies[:3]:
                    title = cs.get("title", "") if isinstance(cs, dict) else str(cs)
                    impact = cs.get("impact", "") if isinstance(cs, dict) else ""
                    content += f"• {title}: {impact}\n"
                return content
            return "Relevant case studies available upon request."
        
        elif "next step" in title_lower or "action" in title_lower:
            return "We look forward to discussing how we can help achieve your objectives. Please contact us to schedule a detailed discussion."
        
        return ""
    
    @classmethod
    def _generate_section_content_ai(
        cls,
        section_title: str,
        rfp_summary: str,
        challenges: List[Dict[str, Any]],
        value_propositions: List[str],
        case_studies: List[Dict[str, Any]]
    ) -> str:
        """Generate section content using AI."""
        from langchain.prompts import ChatPromptTemplate
        
        challenges_text = ""
        if challenges:
            challenges_text = "\n".join([
                f"- {ch.get('description', '')} (Type: {ch.get('type', 'Unknown')}, Impact: {ch.get('impact', 'Unknown')})"
                for ch in challenges[:10]
            ])
        
        value_props_text = "\n".join([f"- {vp}" for vp in value_propositions[:10]]) if value_propositions else "None"
        
        case_studies_text = ""
        if case_studies:
            case_studies_text = "\n".join([
                f"- {cs.get('title', '')}: {cs.get('impact', '')} - {cs.get('description', '')[:200]}"
                for cs in case_studies[:5]
            ])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert proposal writer. Write compelling, professional proposal content that:
- Addresses client needs directly
- Uses specific data and insights
- Is clear and persuasive
- Focuses on business value
- Is appropriate for the section type

Write 2-4 paragraphs of high-quality content."""),
            ("user", """Write content for the proposal section: "{section_title}"

RFP Summary:
{rfp_summary}

Client Challenges:
{challenges}

Value Propositions:
{value_propositions}

Case Studies:
{case_studies}

Write professional, persuasive content for this section. Do not include the section title, only the content."""),
        ])
        
        try:
            chain = prompt | proposal_builder_agent.llm
            response = chain.invoke({
                "section_title": section_title,
                "rfp_summary": rfp_summary or "No summary available",
                "challenges": challenges_text or "No challenges identified",
                "value_propositions": value_props_text or "No value propositions",
                "case_studies": case_studies_text or "No case studies available"
            })
            
            content = response.content if hasattr(response, 'content') else str(response)
            return content.strip()
        except Exception as e:
            print(f"AI generation error: {e}")
            return cls._populate_section_basic(
                {"title": section_title},
                {
                    "rfp_summary": rfp_summary,
                    "challenges": challenges,
                    "value_propositions": value_propositions,
                    "matching_case_studies": case_studies
                }
            )


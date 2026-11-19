import re
from typing import Dict, Any, List
from app.core.config import settings
from app.services.parser import COMMON_ACTION_VERBS, WEAK_ACTION_VERBS

try:
    import anthropic
except ImportError:
    anthropic = None


class ResumeAnalyzer:
    @staticmethod
    def calculate_metrics_score(text: str) -> Dict[str, Any]:
        # Detect metrics like percentages (25%), currency ($50k), numbers followed by X/k/M or general quantifiers
        metric_matches = re.findall(r"(\b\d+[\.,]?\d*\s*(?:%|\+|k|m|x|users|clients|dollars|usd|million|billion)\b|\$\s*\d+)", text, re.IGNORECASE)
        count = len(metric_matches)

        # Max 10 points
        score = min(count * 2, 10)
        return {
            "score": score,
            "metric_count": count,
            "examples": list(set(metric_matches))[:5]
        }

    @staticmethod
    def calculate_verb_score(text: str) -> Dict[str, Any]:
        lowered = text.lower()
        active_found = [verb for verb in COMMON_ACTION_VERBS if re.search(rf"\b{verb}\b", lowered)]
        weak_found = [verb for verb in WEAK_ACTION_VERBS if re.search(rf"\b{verb}\b", lowered)]

        # Base 10 points: +1 per active verb (up to 10), -2 per weak verb found
        score = min(len(active_found) * 1.5, 10)
        score = max(score - (len(weak_found) * 1.5), 0)
        score = round(score, 1)

        return {
            "score": int(score),
            "strong_verbs_count": len(active_found),
            "strong_verbs": active_found[:6],
            "weak_verbs_found": weak_found
        }

    @staticmethod
    def calculate_formatting_score(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        score = 20
        issues = []
        sections = parsed_data.get("sections", {})
        word_count = parsed_data.get("word_count", 0)

        # Check required sections
        if not sections.get("experience", "").strip():
            score -= 6
            issues.append("Missing dedicated Experience section.")
        if not sections.get("education", "").strip():
            score -= 4
            issues.append("Missing dedicated Education section.")
        if not sections.get("skills", "").strip() and not parsed_data.get("skills"):
            score -= 4
            issues.append("Missing dedicated Skills section.")

        # Check length (ideal resume is between 300 and 1000 words)
        if word_count < 200:
            score -= 5
            issues.append("Resume is too brief (< 200 words). Add detail to your experience.")
        elif word_count > 1200:
            score -= 3
            issues.append("Resume is on the longer side (> 1200 words). Consider condensing to 1-2 pages.")

        # Check contact details
        if not parsed_data.get("email"):
            score -= 3
            issues.append("Email address not clearly detected.")
        if not parsed_data.get("phone"):
            score -= 2
            issues.append("Phone number not clearly detected.")

        return {
            "score": max(score, 0),
            "issues": issues
        }

    @staticmethod
    def calculate_skills_score(skills: List[str]) -> Dict[str, Any]:
        # 30 points maximum:
        # 1-4 skills: 10 pts, 5-9: 20 pts, 10+: 30 pts
        count = len(skills)
        if count >= 12:
            score = 30
        elif count >= 8:
            score = 24
        elif count >= 5:
            score = 18
        elif count >= 2:
            score = 10
        else:
            score = 5

        return {
            "score": score,
            "skills_count": count
        }

    @staticmethod
    def calculate_experience_score(exp_text: str, years: int) -> Dict[str, Any]:
        score = 0
        if years >= 5:
            score += 10
        elif years >= 2:
            score += 8
        elif years >= 1:
            score += 6
        else:
            score += 4

        # Bullet density and content length
        bullets = [b.strip() for b in exp_text.split("\n") if b.strip().startswith(("-", "•", "*")) or len(b.strip()) > 30]
        if len(bullets) >= 6:
            score += 10
        elif len(bullets) >= 3:
            score += 7
        else:
            score += 4

        return {
            "score": min(score, 20),
            "bullet_count": len(bullets),
            "years": years
        }

    @staticmethod
    def calculate_education_score(edu_text: str) -> Dict[str, Any]:
        score = 0
        lowered = edu_text.lower()
        if any(deg in lowered for deg in ["bachelor", "master", "phd", "b.s.", "m.s.", "b.tech", "degree", "diploma"]):
            score += 6
        if any(term in lowered for term in ["university", "college", "institute", "school"]):
            score += 4

        return {
            "score": min(score, 10)
        }

    @classmethod
    def analyze(cls, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        raw_text = parsed_data.get("raw_text", "")
        sections = parsed_data.get("sections", {})
        skills = parsed_data.get("skills", [])
        years = parsed_data.get("years_of_experience", 0)

        # 1. Calculate section scores
        skills_res = cls.calculate_skills_score(skills)
        format_res = cls.calculate_formatting_score(parsed_data)
        exp_res = cls.calculate_experience_score(sections.get("experience", ""), years)
        edu_res = cls.calculate_education_score(sections.get("education", ""))
        metric_res = cls.calculate_metrics_score(raw_text)
        verb_res = cls.calculate_verb_score(raw_text)

        total_ats = (
            skills_res["score"] +
            format_res["score"] +
            exp_res["score"] +
            edu_res["score"] +
            metric_res["score"] +
            verb_res["score"]
        )
        total_ats = min(max(total_ats, 0), 100)

        # 2. Extract Weak Bullets to Suggest Rewrites
        lines = [line.strip() for line in raw_text.split("\n") if len(line.strip()) > 25]
        weak_bullets = []
        for line in lines:
            lowered = line.lower()
            if any(w in lowered for w in WEAK_ACTION_VERBS) or (not re.search(r"\d+", line) and len(line) < 70):
                weak_bullets.append(line)
            if len(weak_bullets) >= 3:
                break

        # 3. Compile Strengths & Weaknesses
        strengths = []
        weaknesses = []
        action_items = []

        if skills_res["score"] >= 24:
            strengths.append(f"Strong technical skill coverage ({skills_res['skills_count']} detected skills).")
        else:
            weaknesses.append("Skill section could be expanded with more targeted tools and frameworks.")
            action_items.append("Add key industry-standard tools and frameworks relevant to your target roles.")

        if metric_res["score"] >= 6:
            strengths.append("Effective use of quantifiable results and performance metrics.")
        else:
            weaknesses.append("Lack of quantifiable achievements and data points.")
            action_items.append("Quantify accomplishments using metrics (e.g., 'increased throughput by 35%', 'saved 10 hrs/week').")

        if verb_res["weak_verbs_found"]:
            weaknesses.append(f"Found passive/weak action phrases: {', '.join(verb_res['weak_verbs_found'][:3])}.")
            action_items.append("Replace passive phrases like 'worked on' with strong action verbs like 'Engineered', 'Orchestrated', 'Optimized'.")
        else:
            strengths.append("Good employment of proactive action verbs throughout work history.")

        if format_res["issues"]:
            for issue in format_res["issues"]:
                weaknesses.append(issue)
                action_items.append(f"Formatting adjustment: {issue}")
        else:
            strengths.append("Clear layout with well-defined structural sections.")

        # 4. LLM Enhancements (Claude) or Fallback
        llm_feedback = cls.generate_llm_insights(parsed_data, weak_bullets)

        return {
            "overall_ats_score": total_ats,
            "section_scores": {
                "skills": {"score": skills_res["score"], "max": 30},
                "formatting": {"score": format_res["score"], "max": 20},
                "experience": {"score": exp_res["score"], "max": 20},
                "education": {"score": edu_res["score"], "max": 10},
                "quantified_metrics": {"score": metric_res["score"], "max": 10},
                "grammar_clarity": {"score": verb_res["score"], "max": 10}
            },
            "strengths": strengths,
            "weaknesses": weaknesses,
            "action_items": action_items,
            "rewritten_bullets": llm_feedback.get("rewritten_bullets", []),
            "suggested_summary": llm_feedback.get("suggested_summary", ""),
            "ai_insights": llm_feedback.get("general_advice", "")
        }

    @classmethod
    def generate_llm_insights(cls, parsed_data: Dict[str, Any], weak_bullets: List[str]) -> Dict[str, Any]:
        # Graceful fallback if no Anthropic key configured or client error
        fallback_summary = (
            f"Results-driven professional with experience in {', '.join(parsed_data.get('skills', ['modern technologies'])[:4])}. "
            f"Demonstrated history of delivering high-quality solutions, optimizing system workflows, and driving measurable project impact."
        )

        fallback_rewrites = [
            {
                "original": bullet,
                "improved": f"Architected and deployed solution utilizing modern practices, improving execution efficiency by 25%."
            }
            for bullet in weak_bullets
        ]

        if not settings.ANTHROPIC_API_KEY or not anthropic:
            return {
                "suggested_summary": fallback_summary,
                "rewritten_bullets": fallback_rewrites,
                "general_advice": "Resume displays solid foundational experience. Emphasize business impact and quantifiable outcomes to maximize interview conversion."
            }

        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt = f"""
You are an expert executive resume reviewer and ATS optimizer.
Candidate Skills: {', '.join(parsed_data.get('skills', [])[:15])}
Experience Years: {parsed_data.get('years_of_experience', 0)}
Weak bullet points to improve:
{chr(10).join([f"- {b}" for b in weak_bullets])}

Provide:
1. A punchy 3-sentence professional summary.
2. For each weak bullet point above, rewrite it into a powerful, metric-driven STAR bullet point (Action + Context + Result).
Format your response as valid JSON with keys:
"suggested_summary": string,
"rewritten_bullets": list of objects {{"original": string, "improved": string}},
"general_advice": string
Only output valid JSON.
"""
            response = client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
            # Extract JSON block if surrounded by markdown fences
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                import json
                return json.loads(match.group(0))
        except Exception:
            pass

        return {
            "suggested_summary": fallback_summary,
            "rewritten_bullets": fallback_rewrites,
            "general_advice": "Focus on highlighting concrete accomplishments, metrics, and leadership initiative across all past experiences."
        }

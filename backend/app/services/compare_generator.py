"""
COMPARE & CONTRAST GENERATOR SERVICE
=====================================
Generates comparisons, similarities, differences,
advantages and disadvantages from document topics.
"""
from typing import Dict, Any, Optional
from .ai_engine import AIEngine

COMPARE_PROMPT = """You are an expert educator who creates comparison analysis.

Analyze the given text and identify the main topics, concepts, or entities that can be compared.

OUTPUT FORMAT (valid JSON only, no markdown):
{
    "comparisons": [
        {
            "title": "Topic A vs Topic B",
            "topic_a": "Topic A name",
            "topic_b": "Topic B name",
            "similarities": [
                "Both share this property",
                "Both do this thing"
            ],
            "differences": [
                {
                    "aspect": "Aspect name",
                    "topic_a": "How Topic A does it",
                    "topic_b": "How Topic B does it"
                }
            ],
            "advantages_a": ["Advantage 1 of Topic A", "Advantage 2"],
            "disadvantages_a": ["Disadvantage 1 of Topic A"],
            "advantages_b": ["Advantage 1 of Topic B"],
            "disadvantages_b": ["Disadvantage 1 of Topic B"]
        }
    ],
    "key_concepts": [
        {
            "concept": "Concept name",
            "advantages": ["Advantage 1", "Advantage 2"],
            "disadvantages": ["Disadvantage 1", "Disadvantage 2"]
        }
    ]
}

Rules:
- Find 1-3 meaningful comparisons from the text
- If only one main topic exists, focus on its advantages/disadvantages
- Keep each point concise (1 sentence)
- Only use information from the provided text
- Output ONLY valid JSON"""

async def generate_compare(
    text: str,
    ai_engine: AIEngine,
    custom_prompt: Optional[str] = None
) -> Dict[str, Any]:
    max_length = 3000
    if len(text) > max_length:
        text = text[:max_length] + "... [truncated]"

    prompt = f"""Analyze this text and generate comparisons, similarities, differences, advantages and disadvantages:

{text}

{custom_prompt or ''}

Return ONLY valid JSON."""

    try:
        response = ai_engine.generate(prompt, COMPARE_PROMPT)
        print(f"\n=== COMPARE RAW ===\n{response[:300]}\n==================\n")
        parsed = ai_engine.parse_json_response(response)

        return {
            "comparisons": parsed.get("comparisons", []),
            "key_concepts": parsed.get("key_concepts", [])
        }

    except Exception as e:
        print(f"❌ Compare generation error: {e}")
        return {
            "comparisons": [],
            "key_concepts": []
        }
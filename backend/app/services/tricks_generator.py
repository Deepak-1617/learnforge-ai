"""
LEARNING TRICKS GENERATOR SERVICE
=================================
Generates memory aids, mnemonics, analogies, and simplifications.

Output format:
[
    {
        "type": "mnemonic" | "analogy" | "simplification" | "real_world_example",
        "title": "Short title",
        "content": "The actual trick/explanation"
    }
]
"""

from typing import List, Dict, Any, Optional
from .ai_engine import AIEngine


# System prompt for learning tricks generation
TRICKS_SYSTEM_PROMPT = """You are an expert learning strategist.
Create memory aids and learning tricks to help students remember and understand concepts.

TYPES OF TRICKS TO GENERATE:
1. Mnemonics - Memory devices using acronyms, rhymes, or patterns
2. Analogies - Compare complex concepts to familiar things
3. Simplifications - Break down complex ideas into simple terms
4. Real-world examples - Show practical applications

RULES:
1. Make tricks memorable and engaging
2. Use simple language
3. Connect to everyday experiences when possible
4. Generate 2-4 tricks per chunk

OUTPUT FORMAT (valid JSON only):
{
    "tricks": [
        {
            "type": "mnemonic",
            "title": "Remember the Order",
            "content": "My Very Educated Mother Just Served Us Noodles (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune)"
        }
    ]
}

Do not include any text outside the JSON structure."""


async def generate_tricks_chunk(
    text_chunk: str,
    ai_engine: AIEngine,
    custom_prompt: Optional[str] = None
) -> List[Dict[str, str]]:
    """
    Generate learning tricks from a single text chunk.

    Args:
        text_chunk: A chunk of text
        ai_engine: The AI engine instance
        custom_prompt: Optional custom instructions

    Returns:
        List of learning tricks
    """
    prompt = f"""Generate 2-4 learning tricks from this text:

{text_chunk}

Focus on making the content memorable and easy to understand.
{custom_prompt if custom_prompt else ""}

Remember: Output ONLY valid JSON, no other text."""

    try:
        response = ai_engine.generate(prompt, TRICKS_SYSTEM_PROMPT)
        parsed = ai_engine.parse_json_response(response)

        tricks = parsed.get("tricks", [])

        # Validate and normalize
        normalized = []
        for trick in tricks:
            if _is_valid_trick(trick):
                normalized.append(_normalize_trick(trick))

        return normalized

    except Exception as e:
        print(f"Tricks generation error: {e}")
        return []


def _is_valid_trick(trick: Dict) -> bool:
    """Check if trick has required fields"""
    return "type" in trick and "content" in trick and trick["content"]


def _normalize_trick(trick: Dict) -> Dict[str, str]:
    """Normalize trick format"""
    return {
        "type": trick.get("type", "tip"),
        "title": trick.get("title", "Learning Tip"),
        "content": trick.get("content", "").strip()
    }


def merge_tricks(tricks_results: List[List[Dict]]) -> List[Dict]:
    """
    Merge tricks from multiple chunks.
    Removes duplicates and limits total.

    Args:
        tricks_results: List of tricks lists from each chunk

    Returns:
        Merged list of unique tricks
    """
    all_tricks = []
    seen_content = set()

    for chunk_tricks in tricks_results:
        for trick in chunk_tricks:
            content_hash = hash(trick.get("content", ""))
            if content_hash not in seen_content:
                seen_content.add(content_hash)
                all_tricks.append(trick)

    # Limit to 10 tricks total
    return all_tricks[:10]

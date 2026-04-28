"""
FLASHCARD GENERATOR SERVICE
===========================
Generates Q&A flashcards from text chunks.

Output format:
[
    {
        "question": "What is...?",
        "answer": "The answer is..."
    }
]
"""

from typing import List, Dict, Any, Optional
from .ai_engine import AIEngine


# System prompt for flashcard generation
FLASHCARD_SYSTEM_PROMPT = """You are an expert educational content creator.
Generate concise flashcards (question-answer pairs) from the given text.

RULES:
1. Questions should be clear and specific
2. Answers should be concise but complete
3. Focus on key concepts, definitions, and important facts
4. Generate 5-8 flashcards per chunk
5. Avoid yes/no questions

OUTPUT FORMAT (valid JSON only):
{
    "flashcards": [
        {
            "question": "What is the capital of France?",
            "answer": "Paris is the capital of France."
        }
    ]
}

Do not include any text outside the JSON structure."""


async def generate_flashcards_chunk(
    text_chunk: str,
    ai_engine: AIEngine,
    custom_prompt: Optional[str] = None
) -> List[Dict[str, str]]:
    """
    Generate flashcards from a single text chunk.

    Args:
        text_chunk: A chunk of text
        ai_engine: The AI engine instance
        custom_prompt: Optional custom instructions

    Returns:
        List of flashcards (question-answer pairs)
    """
    prompt = f"""Generate 5-8 flashcards from this text:

{text_chunk}

{custom_prompt if custom_prompt else ""}

Remember: Output ONLY valid JSON, no other text."""

    try:
        response = ai_engine.generate(prompt, FLASHCARD_SYSTEM_PROMPT)
        parsed = ai_engine.parse_json_response(response)

        flashcards = parsed.get("flashcards", [])

        # Validate and normalize
        normalized = []
        for card in flashcards:
            if _is_valid_flashcard(card):
                normalized.append(_normalize_flashcard(card))

        return normalized

    except Exception as e:
        print(f"Flashcard generation error: {e}")
        return []


def _is_valid_flashcard(card: Dict) -> bool:
    """Check if flashcard has required fields"""
    return "question" in card and "answer" in card and card["question"] and card["answer"]


def _normalize_flashcard(card: Dict) -> Dict[str, str]:
    """Normalize flashcard format"""
    return {
        "question": card.get("question", "").strip(),
        "answer": card.get("answer", "").strip()
    }


def merge_flashcards(flashcard_results: List[List[Dict]]) -> List[Dict]:
    """
    Merge flashcards from multiple chunks.
    Removes duplicates and limits total.

    Args:
        flashcard_results: List of flashcard lists from each chunk

    Returns:
        Merged list of unique flashcards
    """
    all_cards = []
    seen_questions = set()

    for chunk_cards in flashcard_results:
        for card in chunk_cards:
            q_hash = hash(card.get("question", ""))
            if q_hash not in seen_questions:
                seen_questions.add(q_hash)
                all_cards.append(card)

    # Limit to 20 flashcards total
    return all_cards[:20]

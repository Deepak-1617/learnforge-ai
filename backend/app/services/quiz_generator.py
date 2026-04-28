"""
QUIZ GENERATOR SERVICE
======================
Generates multiple-choice questions (MCQs) from text chunks.

Output format:
[
    {
        "question": "What is...?",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "answer": "A",
        "explanation": "Why this is correct..."
    }
]
"""

from typing import List, Dict, Any, Optional
from .ai_engine import AIEngine


# System prompt for quiz generation
QUIZ_SYSTEM_PROMPT = """You are an expert educational content creator.
Generate high-quality multiple-choice questions (MCQs) from the given text.

RULES:
1. Each question must test understanding, not just recall
2. All options should be plausible (no obvious wrong answers)
3. The correct answer should be clearly indicated
4. Include a brief explanation for why the answer is correct
5. Generate 3-5 questions per chunk

OUTPUT FORMAT (valid JSON only):
{
    "questions": [
        {
            "question": "Question text here?",
            "options": {
                "A": "First option",
                "B": "Second option",
                "C": "Third option",
                "D": "Fourth option"
            },
            "correct_answer": "A",
            "explanation": "Brief explanation of why this is correct"
        }
    ]
}

Do not include any text outside the JSON structure."""


async def generate_quiz_chunk(
    text_chunk: str,
    ai_engine: AIEngine,
    custom_prompt: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Generate quiz questions from a single text chunk.

    Args:
        text_chunk: A chunk of text to generate questions from
        ai_engine: The AI engine instance
        custom_prompt: Optional custom instructions

    Returns:
        List of quiz questions
    """
    prompt = f"""Generate 3-5 multiple-choice questions from this text:

{text_chunk}

{custom_prompt if custom_prompt else ""}

Remember: Output ONLY valid JSON, no other text."""

    try:
        response = ai_engine.generate(prompt, QUIZ_SYSTEM_PROMPT)
        parsed = ai_engine.parse_json_response(response)

        questions = parsed.get("questions", [])

        # Validate and normalize the format
        normalized = []
        for q in questions:
            if _is_valid_question(q):
                normalized.append(_normalize_question(q))

        return normalized

    except Exception as e:
        print(f"Quiz generation error: {e}")
        return []


def _is_valid_question(question: Dict) -> bool:
    """Check if a question has all required fields"""
    required = ["question", "options", "correct_answer"]
    return all(key in question for key in required)


def _normalize_question(question: Dict) -> Dict:
    """
    Normalize question format to consistent structure.
    Handles different option formats (dict vs list).
    """
    options = question.get("options", {})

    # Convert dict options to list format
    if isinstance(options, dict):
        options_list = []
        for key, value in options.items():
            options_list.append(f"{key}) {value}")
    else:
        options_list = options

    return {
        "question": question.get("question", ""),
        "options": options_list,
        "answer": question.get("correct_answer", "A"),
        "explanation": question.get("explanation", "")
    }


def merge_quizzes(quiz_results: List[List[Dict]]) -> List[Dict]:
    """
    Merge quiz results from multiple chunks.
    Removes duplicates and limits total questions.

    Args:
        quiz_results: List of quiz lists from each chunk

    Returns:
        Merged list of unique questions
    """
    all_questions = []
    seen_questions = set()

    for chunk_questions in quiz_results:
        for q in chunk_questions:
            # Create a hash of the question to detect duplicates
            q_hash = hash(q.get("question", ""))
            if q_hash not in seen_questions:
                seen_questions.add(q_hash)
                all_questions.append(q)

    # Limit to 10 questions total (adjust as needed)
    return all_questions[:10]

# backend/app/services/ai_engine.py

import os
import json
import re
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

# Load .env from backend folder (handles multiple locations)
env_file = Path(__file__).parent.parent.parent / '.env'  # Try backend/.env
if not env_file.exists():
    env_file = Path(__file__).parent.parent.parent.parent / '.env'  # Try root/.env

if env_file.exists():
    load_dotenv(env_file, override=True)
    print(f"✅ Loaded environment from: {env_file}")
else:
    load_dotenv()  # Try default locations
    print("⚠️ Using default .env loading")

# ── Model Configuration ────────────────────────────────────────────────────────
PRIMARY_MODEL  = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"

# ── Initialize Groq Client ─────────────────────────────────────────────────────
def get_groq_client() -> Groq:
    """Returns initialized Groq client."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY not found in environment variables. "
            "Add it to your .env file."
        )
    return Groq(api_key=api_key)


# ── JSON Extraction Helper ─────────────────────────────────────────────────────
def extract_json(text: str) -> any:
    """
    Robustly extracts JSON from AI response.
    Handles markdown code blocks, extra text, etc.
    """
    if not text:
        raise ValueError("Empty response from AI")

    # Method 1: Try direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Method 2: Extract from ```json ... ``` blocks
    json_block = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_block:
        try:
            return json.loads(json_block.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Method 3: Find first [ or { and extract balanced JSON
    for start_char, end_char in [('[', ']'), ('{', '}')]:
        start = text.find(start_char)
        if start == -1:
            continue
        depth = 0
        in_string = False
        escape_next = False
        for i, ch in enumerate(text[start:], start):
            if escape_next:
                escape_next = False
                continue
            if ch == '\\' and in_string:
                escape_next = True
                continue
            if ch == '"' and not escape_next:
                in_string = not in_string
                continue
            if not in_string:
                if ch == start_char:
                    depth += 1
                elif ch == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start:i+1])
                        except json.JSONDecodeError:
                            break

    raise ValueError(
        f"Could not extract valid JSON from response:\n{text[:300]}..."
    )


# ── Core Generate Function (standalone) ───────────────────────────────────────
def groq_generate(
    prompt: str,
    system: str = "",
    max_tokens: int = 2048
) -> str:
    """
    Standalone generation function with automatic fallback.
    Used by chat.py and other services directly.
    """
    client = get_groq_client()

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    # Try primary model
    try:
        response = client.chat.completions.create(
            model=PRIMARY_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content

    except Exception as primary_err:
        err_str = str(primary_err).lower()
        if any(kw in err_str for kw in [
            "decommissioned", "not found", "model",
            "deprecated", "invalid", "does not exist"
        ]):
            print(f"⚠️  Primary model failed, trying fallback...")
            try:
                response = client.chat.completions.create(
                    model=FALLBACK_MODEL,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.7,
                )
                return response.choices[0].message.content
            except Exception as fallback_err:
                raise RuntimeError(
                    f"Both models failed.\n"
                    f"Primary: {primary_err}\n"
                    f"Fallback: {fallback_err}"
                )
        raise RuntimeError(f"Groq generation failed: {primary_err}")


# ══════════════════════════════════════════════════════════════════════════════
# AIEngine CLASS
# ══════════════════════════════════════════════════════════════════════════════
class AIEngine:
    """
    AIEngine class — wraps Groq AI functionality.
    Backwards compatible with all existing routes and services.
    """

    def __init__(self):
        self.client = get_groq_client()
        self.model = PRIMARY_MODEL
        self.fallback_model = FALLBACK_MODEL
        print(f"✅ Groq AI initialized with model: {self.model}")

    # ── Internal generate ──────────────────────────────────────────────────────
    def _generate(
        self,
        messages: list,
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> str:
        """Internal generate with automatic model fallback."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content

        except Exception as e:
            err_str = str(e).lower()
            if any(kw in err_str for kw in [
                "decommissioned", "not found", "model",
                "deprecated", "invalid", "does not exist"
            ]):
                print(f"⚠️  Switching to fallback: {self.fallback_model}")
                try:
                    response = self.client.chat.completions.create(
                        model=self.fallback_model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                    )
                    return response.choices[0].message.content
                except Exception as fallback_err:
                    raise RuntimeError(
                        f"Both models failed.\n"
                        f"Primary: {e}\n"
                        f"Fallback: {fallback_err}"
                    )
            raise RuntimeError(f"Groq generation failed: {e}")

    # ── Public generate (used by quiz_generator.py) ────────────────────────────
    def generate(
        self,
        prompt: str,
        system: str = "",
        max_tokens: int = 2048
    ) -> str:
        """
        Public generate method.
        Called as: ai_engine.generate(prompt, system_prompt)
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return self._generate(messages, max_tokens)

    # ── parse_json_response (used by quiz_generator.py) ───────────────────────
    def parse_json_response(self, text: str) -> any:
        """
        Parse JSON from AI response.
        Called as: ai_engine.parse_json_response(response)

        Handles:
        - Raw JSON strings
        - JSON wrapped in ```json ... ``` blocks
        - JSON with extra text around it
        """
        return extract_json(text)

    # ── generate_quiz ──────────────────────────────────────────────────────────
    def generate_quiz(
        self,
        text: str,
        num_questions: int = 5
    ) -> list:
        """Generate quiz questions from document text."""
        truncated = text[:4000] if len(text) > 4000 else text

        system = """You are an expert educator and quiz designer.
Generate clear, educational multiple-choice questions.
Always respond with valid JSON only — no extra text, no markdown."""

        prompt = f"""Create {num_questions} multiple-choice quiz questions from this text.

TEXT:
{truncated}

Return ONLY this JSON array (no other text):
[
  {{
    "question": "Clear question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "answer": "Option A",
    "explanation": "Brief explanation of why this is correct."
  }}
]

Rules:
- correct = index (0-3) of the correct option in the options array
- answer = the text of the correct option
- Make questions test understanding, not just memorization
- Keep options similar in length to avoid obvious wrong answers
- Explanations should be 1-2 sentences"""

        try:
            response = self.generate(prompt, system, max_tokens=2048)
            questions = extract_json(response)

            validated = []
            for q in questions:
                if (
                    isinstance(q, dict)
                    and "question" in q
                    and "options" in q
                    and isinstance(q["options"], list)
                    and len(q["options"]) >= 2
                ):
                    # Normalize correct index
                    correct_idx = int(q.get("correct", 0))
                    correct_idx = max(0, min(correct_idx, len(q["options"]) - 1))
                    q["correct"] = correct_idx

                    # Ensure answer field exists
                    if "answer" not in q:
                        q["answer"] = q["options"][correct_idx]

                    q.setdefault("explanation", "Review the source material.")
                    validated.append(q)

            print(f"✅ Quiz generated: {len(validated)} questions")
            return validated

        except Exception as e:
            raise RuntimeError(f"Quiz generation failed: {e}")

    # ── generate_flashcards ────────────────────────────────────────────────────
    def generate_flashcards(
        self,
        text: str,
        num_cards: int = 8
    ) -> list:
        """Generate flashcards from document text."""
        truncated = text[:4000] if len(text) > 4000 else text

        system = """You are an expert at creating study flashcards.
Create concise, memorable flashcards that aid retention.
Always respond with valid JSON only."""

        prompt = f"""Create {num_cards} study flashcards from this text.

TEXT:
{truncated}

Return ONLY this JSON array:
[
  {{
    "front": "Key term, concept, or question",
    "back": "Clear, concise definition or answer (2-4 sentences max)"
  }}
]

Rules:
- Front: short and specific (term, concept, or question format)
- Back: clear explanation with the most important details
- Cover the most important concepts from the text
- Use simple language"""

        try:
            response = self.generate(prompt, system, max_tokens=2048)
            cards = extract_json(response)

            validated = []
            for card in cards:
                if (
                    isinstance(card, dict)
                    and "front" in card
                    and "back" in card
                    and str(card["front"]).strip()
                    and str(card["back"]).strip()
                ):
                    validated.append({
                        "front": str(card["front"]).strip(),
                        "back":  str(card["back"]).strip()
                    })

            print(f"✅ Flashcards generated: {len(validated)} cards")
            return validated

        except Exception as e:
            raise RuntimeError(f"Flashcard generation failed: {e}")

    # ── generate_tricks ────────────────────────────────────────────────────────
    def generate_tricks(self, text: str) -> list:
        """Generate memory tricks and mnemonics."""
        truncated = text[:3000] if len(text) > 3000 else text

        system = """You are a memory coach specializing in mnemonics.
Create creative, memorable tricks that make concepts stick.
Always respond with valid JSON only."""

        prompt = f"""Create 5 memory tricks and mnemonics for this content.

TEXT:
{truncated}

Return ONLY this JSON array:
[
  {{
    "title": "Short catchy name for the trick",
    "type": "mnemonic|acronym|story|visualization|pattern",
    "trick": "The actual memory trick or mnemonic",
    "explanation": "How to use this trick and why it works"
  }}
]

Include a mix of: acronyms, rhymes, visual associations, story methods."""

        try:
            response = self.generate(prompt, system, max_tokens=1500)
            tricks = extract_json(response)

            validated = []
            for t in tricks:
                if isinstance(t, dict) and "trick" in t:
                    validated.append({
                        "title":       t.get("title", "Memory Trick"),
                        "type":        t.get("type", "mnemonic"),
                        "trick":       t["trick"],
                        "explanation": t.get("explanation", "")
                    })

            print(f"✅ Memory tricks generated: {len(validated)}")
            return validated

        except Exception as e:
            raise RuntimeError(f"Tricks generation failed: {e}")

    # ── generate_summary ───────────────────────────────────────────────────────
    def generate_summary(self, text: str) -> dict:
        """Generate a structured summary of the document."""
        truncated = text[:5000] if len(text) > 5000 else text

        system = """You are an expert at analyzing and summarizing educational content.
Always respond with valid JSON only."""

        prompt = f"""Create a structured summary of this document.

TEXT:
{truncated}

Return ONLY this JSON object:
{{
  "title": "Inferred document title or topic",
  "summary": "2-3 paragraph comprehensive summary as a single string",
  "key_points": [
    "Most important point 1",
    "Most important point 2",
    "Most important point 3",
    "Most important point 4",
    "Most important point 5"
  ],
  "concepts": [
    {{
      "term": "Key concept or term",
      "definition": "Clear, concise definition"
    }}
  ],
  "takeaways": "1-2 sentence conclusion",
  "difficulty": "beginner|intermediate|advanced",
  "topics": ["topic1", "topic2", "topic3"]
}}

Rules:
- key_points: 5-7 most important points
- concepts: 3-6 key terms defined
- Be specific, not generic"""

        try:
            response = self.generate(prompt, system, max_tokens=2000)
            summary = extract_json(response)

            if not isinstance(summary, dict):
                raise ValueError("Summary must be a JSON object")

            summary.setdefault("title",      "Document Summary")
            summary.setdefault("summary",    "")
            summary.setdefault("key_points", [])
            summary.setdefault("concepts",   [])
            summary.setdefault("takeaways",  "")
            summary.setdefault("difficulty", "intermediate")
            summary.setdefault("topics",     [])

            print("✅ Summary generated successfully")
            return summary

        except Exception as e:
            raise RuntimeError(f"Summary generation failed: {e}")

    # ── generate_comparison ────────────────────────────────────────────────────
    def generate_comparison(self, text: str) -> dict:
        """Generate comparison/contrast analysis."""
        truncated = text[:4000] if len(text) > 4000 else text

        system = """You are an analytical educator who excels at comparing concepts.
Always respond with valid JSON only."""

        prompt = f"""Identify and compare the main concepts in this text.

TEXT:
{truncated}

Return ONLY this JSON object:
{{
  "concept_a": "Name of first concept",
  "concept_b": "Name of second concept",
  "similarities": [
    "Similarity point 1",
    "Similarity point 2"
  ],
  "differences": [
    {{
      "aspect": "Aspect being compared",
      "concept_a": "How concept A relates",
      "concept_b": "How concept B relates"
    }}
  ],
  "verdict": "Brief conclusion about the comparison"
}}"""

        try:
            response = self.generate(prompt, system, max_tokens=1500)
            comparison = extract_json(response)

            if not isinstance(comparison, dict):
                raise ValueError("Comparison must be a JSON object")

            comparison.setdefault("concept_a",   "Concept A")
            comparison.setdefault("concept_b",   "Concept B")
            comparison.setdefault("similarities", [])
            comparison.setdefault("differences",  [])
            comparison.setdefault("verdict",      "")

            print("✅ Comparison generated successfully")
            return comparison

        except Exception as e:
            raise RuntimeError(f"Comparison generation failed: {e}")

    # ── check_health ───────────────────────────────────────────────────────────
    def check_health(self) -> dict:
        """Quick health check — verifies Groq connection."""
        try:
            result = self._generate([
                {"role": "system", "content": "You respond with exactly one word."},
                {"role": "user",   "content": "Say OK and nothing else."}
            ], max_tokens=10)
            return {
                "status":   "healthy",
                "model":    self.model,
                "fallback": self.fallback_model,
                "response": result.strip()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error":  str(e),
                "model":  self.model
            }

    # ── is_available ───────────────────────────────────────────────────────────
    def is_available(self) -> bool:
        """
        Check if AI engine is available and ready.
        Called by generate.py before processing.
        """
        try:
            health = self.check_health()
            return health.get("status") == "healthy"
        except Exception:
            return False


# ── Singleton AI Engine Getter ────────────────────────────────────────────────

_ai_engine_instance = None

def get_ai_engine() -> AIEngine:
    """
    Return a shared AIEngine instance.
    Existing routes call this function.
    """
    global _ai_engine_instance

    if _ai_engine_instance is None:
        _ai_engine_instance = AIEngine()

    return _ai_engine_instance


# ── Standalone functions ──────────────────────────────────────────────────────

def generate_quiz(text: str, num_questions: int = 5) -> list:
    return get_ai_engine().generate_quiz(text, num_questions)


def generate_flashcards(text: str, num_cards: int = 8) -> list:
    return get_ai_engine().generate_flashcards(text, num_cards)


def generate_tricks(text: str) -> list:
    return get_ai_engine().generate_tricks(text)


def generate_summary(text: str) -> dict:
    return get_ai_engine().generate_summary(text)


def generate_comparison(text: str) -> dict:
    return get_ai_engine().generate_comparison(text)


def check_ai_health() -> dict:
    return get_ai_engine().check_health()
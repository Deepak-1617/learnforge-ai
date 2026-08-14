import os
import json
import re
from pathlib import Path
from groq import Groq
from openai import OpenAI
from dotenv import load_dotenv

env_file = Path(__file__).parent.parent.parent / '.env'
if env_file.exists():
    load_dotenv(env_file, override=True)
else:
    load_dotenv(override=True)


def extract_json(text: str):
    if not text:
        raise ValueError("Empty response from AI")
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    json_block = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_block:
        try:
            return json.loads(json_block.group(1).strip())
        except json.JSONDecodeError:
            pass
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
    raise ValueError(f"Could not extract valid JSON:\n{text[:300]}")


class AIEngine:
    def __init__(self):
        # ── Groq Setup ───────────────────────────────────────
        groq_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.groq_client = None

        if groq_key:
            self.groq_client = Groq(api_key=groq_key)
            print(f"✅ Groq ready: {self.groq_model}")
        else:
            print("⚠️ Groq not configured")

        # ── Cerebras Setup ───────────────────────────────────
        cerebras_key = os.getenv("CEREBRAS_API_KEY")
        self.cerebras_model = os.getenv("CEREBRAS_MODEL", "llama-3.3-70b")
        self.cerebras_client = None

        if cerebras_key:
            # Cerebras uses OpenAI-compatible API
            self.cerebras_client = OpenAI(
                api_key=cerebras_key,
                base_url="https://api.cerebras.ai/v1"
            )
            print(f"✅ Cerebras ready: {self.cerebras_model}")
        else:
            print("⚠️ Cerebras not configured")

        if not self.groq_client and not self.cerebras_client:
            raise ValueError(
                "No AI provider configured. "
                "Add GROQ_API_KEY or CEREBRAS_API_KEY to backend/.env"
            )

        # Set active provider info for frontend display
        if self.groq_client:
            self.model = self.groq_model
            self.fallback_model = self.cerebras_model
        else:
            self.model = self.cerebras_model
            self.fallback_model = self.cerebras_model

    def _generate_groq(self, messages: list, max_tokens: int = 2048) -> str:
        """Generate using Groq."""
        response = self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content

    def _generate_cerebras(self, messages: list, max_tokens: int = 2048) -> str:
        """Generate using Cerebras."""
        response = self.cerebras_client.chat.completions.create(
            model=self.cerebras_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content

    def _generate(self, messages: list, max_tokens: int = 2048) -> str:
        """
        Try Groq first. If it fails, automatically fall back to Cerebras.
        """
        # Try Groq first
        if self.groq_client:
            try:
                result = self._generate_groq(messages, max_tokens)
                print("  ⚡ Used: Groq")
                return result
            except Exception as e:
                error_msg = str(e).lower()
                print(f"  ⚠️ Groq failed: {e}")

                # Only fallback on rate limit or quota errors
                if any(kw in error_msg for kw in [
                    "rate_limit", "429", "quota", "exceeded",
                    "decommissioned", "not found", "deprecated"
                ]):
                    print("  🔄 Switching to Cerebras...")
                else:
                    raise RuntimeError(f"Groq error: {e}")

        # Try Cerebras
        if self.cerebras_client:
            try:
                result = self._generate_cerebras(messages, max_tokens)
                print("  ⚡ Used: Cerebras")
                return result
            except Exception as e:
                raise RuntimeError(f"Cerebras error: {e}")

        raise RuntimeError("No AI provider available.")

    def generate(self, prompt: str, system: str = "", max_tokens: int = 2048) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return self._generate(messages, max_tokens)

    def parse_json_response(self, text: str):
        return extract_json(text)

    def is_available(self) -> bool:
        try:
            return self.check_health().get("status") == "healthy"
        except Exception:
            return False

    def check_health(self) -> dict:
        try:
            result = self._generate([
                {"role": "system", "content": "You respond with exactly one word."},
                {"role": "user", "content": "Say OK and nothing else."}
            ], max_tokens=10)
            return {
                "status": "healthy",
                "model": self.model,
                "fallback": self.fallback_model,
                "response": result.strip()
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e), "model": self.model}

    def generate_quiz(self, text: str, num_questions: int = 5) -> list:
        truncated = text[:4000]
        system = "You are an expert educator. Always respond with valid JSON only."
        prompt = f"""Create {num_questions} multiple-choice questions from this text.

TEXT:
{truncated}

Return ONLY this JSON array:
[
  {{
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "answer": "Option A",
    "explanation": "Why this is correct."
  }}
]"""
        response = self.generate(prompt, system, max_tokens=2048)
        questions = extract_json(response)
        validated = []
        for q in questions:
            if isinstance(q, dict) and "question" in q and "options" in q:
                correct_idx = int(q.get("correct", 0))
                correct_idx = max(0, min(correct_idx, len(q["options"]) - 1))
                q["correct"] = correct_idx
                if "answer" not in q:
                    q["answer"] = q["options"][correct_idx]
                q.setdefault("explanation", "Review the source material.")
                validated.append(q)
        print(f"✅ Quiz: {len(validated)} questions")
        return validated

    def generate_flashcards(self, text: str, num_cards: int = 8) -> list:
        truncated = text[:4000]
        system = "You are an expert at creating study flashcards. Always respond with valid JSON only."
        prompt = f"""Create {num_cards} flashcards from this text.

TEXT:
{truncated}

Return ONLY this JSON array:
[
  {{
    "front": "Key term or question",
    "back": "Clear answer or definition"
  }}
]"""
        response = self.generate(prompt, system, max_tokens=2048)
        cards = extract_json(response)
        validated = []
        for card in cards:
            if isinstance(card, dict) and "front" in card and "back" in card:
                validated.append({
                    "front": str(card["front"]).strip(),
                    "back": str(card["back"]).strip()
                })
        print(f"✅ Flashcards: {len(validated)}")
        return validated

    def generate_tricks(self, text: str) -> list:
        truncated = text[:3000]
        system = "You are a memory coach. Always respond with valid JSON only."
        prompt = f"""Create 5 memory tricks for this content.

TEXT:
{truncated}

Return ONLY this JSON array:
[
  {{
    "title": "Trick name",
    "type": "mnemonic|acronym|story|visualization|pattern",
    "trick": "The actual memory trick",
    "explanation": "How to use it"
  }}
]"""
        response = self.generate(prompt, system, max_tokens=1500)
        tricks = extract_json(response)
        validated = []
        for t in tricks:
            if isinstance(t, dict) and "trick" in t:
                validated.append({
                    "title": t.get("title", "Memory Trick"),
                    "type": t.get("type", "mnemonic"),
                    "trick": t["trick"],
                    "explanation": t.get("explanation", "")
                })
        print(f"✅ Tricks: {len(validated)}")
        return validated

    def generate_summary(self, text: str) -> dict:
        truncated = text[:5000]
        system = "You are an expert summarizer. Always respond with valid JSON only."
        prompt = f"""Create a structured summary of this document.

TEXT:
{truncated}

Return ONLY this JSON object:
{{
  "title": "Document topic",
  "summary": "2-3 paragraph summary",
  "key_points": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "concepts": [{{"term": "Key term", "definition": "Definition"}}],
  "takeaways": "1-2 sentence conclusion",
  "difficulty": "beginner|intermediate|advanced",
  "topics": ["topic1", "topic2"]
}}"""
        response = self.generate(prompt, system, max_tokens=2000)
        summary = extract_json(response)
        summary.setdefault("title", "Document Summary")
        summary.setdefault("summary", "")
        summary.setdefault("key_points", [])
        summary.setdefault("concepts", [])
        summary.setdefault("takeaways", "")
        summary.setdefault("difficulty", "intermediate")
        summary.setdefault("topics", [])
        print("✅ Summary generated")
        return summary

    def generate_comparison(self, text: str) -> dict:
        truncated = text[:4000]
        system = "You are an analytical educator. Always respond with valid JSON only."
        prompt = f"""Compare the main concepts in this text.

TEXT:
{truncated}

Return ONLY this JSON object:
{{
  "concept_a": "First concept name",
  "concept_b": "Second concept name",
  "similarities": ["Similarity 1", "Similarity 2"],
  "differences": [
    {{
      "aspect": "Aspect being compared",
      "concept_a": "How concept A relates",
      "concept_b": "How concept B relates"
    }}
  ],
  "verdict": "Brief conclusion"
}}"""
        response = self.generate(prompt, system, max_tokens=1500)
        comparison = extract_json(response)
        comparison.setdefault("concept_a", "Concept A")
        comparison.setdefault("concept_b", "Concept B")
        comparison.setdefault("similarities", [])
        comparison.setdefault("differences", [])
        comparison.setdefault("verdict", "")
        print("✅ Comparison generated")
        return comparison


# ── Singleton ────────────────────────────────────────────────────
_ai_engine_instance = None

def get_ai_engine() -> AIEngine:
    global _ai_engine_instance
    if _ai_engine_instance is None:
        _ai_engine_instance = AIEngine()
    return _ai_engine_instance


def get_groq_client():
    return get_ai_engine().groq_client

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
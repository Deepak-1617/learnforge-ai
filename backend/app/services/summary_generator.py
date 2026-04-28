"""
SUMMARY GENERATOR SERVICE
"""
from typing import Dict, Any, Optional
from .ai_engine import AIEngine

SUMMARY_SYSTEM_PROMPT = """You are an expert summarizer.
Create a concise summary of the given text.

OUTPUT FORMAT (valid JSON only, no markdown, no extra text):
{
    "summary": "A concise paragraph summarizing the main content...",
    "key_points": [
        "First key point",
        "Second key point",
        "Third key point"
    ]
}"""

async def generate_summary(
    text: str,
    ai_engine: AIEngine,
    custom_prompt: Optional[str] = None
) -> Dict[str, Any]:
    # Truncate very long text
    max_length = 4000
    if len(text) > max_length:
        text = text[:max_length] + "... [truncated]"

    prompt = f"""Summarize this text and return ONLY a JSON object with "summary" and "key_points" fields:

{text}"""

    try:
        response = ai_engine.generate(prompt, SUMMARY_SYSTEM_PROMPT)
        
        # Debug: print raw response to terminal
        print(f"\n=== SUMMARY RAW RESPONSE ===\n{response}\n============================\n")
        
        parsed = ai_engine.parse_json_response(response)
        
        return {
            "summary": parsed.get("summary", "No summary generated").strip(),
            "key_points": parsed.get("key_points", []),
            "word_count": len(parsed.get("summary", "").split())
        }

    except Exception as e:
        print(f"\n❌ Summary generation error: {e}\n")
        
        # Last resort: return raw response as summary if it exists
        try:
            if response and len(response) > 10:
                return {
                    "summary": response[:500],
                    "key_points": ["Could not parse structured response"],
                    "word_count": len(response.split())
                }
        except:
            pass
            
        return {
            "summary": "Unable to generate summary. Please try again.",
            "key_points": [],
            "word_count": 0
        }
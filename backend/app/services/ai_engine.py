"""
AI ENGINE - GROQ POWERED
========================
All AI calls go through this single file.
Now using Groq for ultra-fast inference.
"""

import os
import json
import re
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend folder (same file as main.py uses; utf-8-sig strips BOM on Windows)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
dotenv_path = _BACKEND_ROOT / ".env"
load_dotenv(dotenv_path=dotenv_path, override=True, encoding="utf-8-sig")

GROQ_KEY_PLACEHOLDER = "gsk_your_groq_api_key_here"


class AIEngine:
    def __init__(self):
        self.current_provider = None
        self.client = None
        self.model = None
        self._initialize_provider()

    def _initialize_provider(self):
        """Initialize the AI provider based on .env settings"""
        groq_enabled = os.getenv("GROQ_ENABLED", "true").lower() == "true"
        openai_enabled = os.getenv("OPENAI_ENABLED", "false").lower() == "true"
        local_enabled = os.getenv("LOCAL_LLM_ENABLED", "false").lower() == "true"

        if groq_enabled:
            self._setup_groq()
        elif openai_enabled:
            self._setup_openai()
        elif local_enabled:
            self._setup_local_llm()
        else:
            print("⚠️  No AI provider enabled. Set GROQ_ENABLED=true in .env")

    def _setup_groq(self):
        """Setup Groq API"""
        try:
            from groq import Groq

            api_key = (os.getenv("GROQ_API_KEY") or "").strip()

            if not api_key or api_key == GROQ_KEY_PLACEHOLDER:
                print("❌ GROQ_API_KEY not found or using placeholder")
                print(f"   Add GROQ_API_KEY to: {dotenv_path}")
                print("   Get a free key: https://console.groq.com/")
                return

            self.client = Groq(api_key=api_key)
            self.current_provider = "groq"
            self.model = "llama3-8b-8192"  # Fast Llama 3 model
            print(f"✅ Groq AI initialized with model: {self.model}")

        except ImportError:
            print("❌ groq not installed. Run: pip install groq")
        except Exception as e:
            print(f"❌ Groq setup failed: {e}")

    def _setup_openai(self):
        """Setup OpenAI (backup option)"""
        try:
            from openai import OpenAI

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                print("❌ OPENAI_API_KEY not found in .env")
                return

            self.client = OpenAI(api_key=api_key)
            self.current_provider = "openai"
            self.model = "gpt-3.5-turbo"
            print(f"✅ OpenAI initialized with model: {self.model}")

        except ImportError:
            print("❌ openai not installed. Run: pip install openai")
        except Exception as e:
            print(f"❌ OpenAI setup failed: {e}")

    def _setup_local_llm(self):
        """Setup Local LLM via Ollama"""
        try:
            self.base_url = os.getenv("LOCAL_LLM_BASE_URL", "http://localhost:11434")
            self.model = os.getenv("LOCAL_LLM_MODEL", "llama2")
            self.current_provider = "local"
            print(f"✅ Local LLM initialized: {self.model} at {self.base_url}")
        except Exception as e:
            print(f"❌ Local LLM setup failed: {e}")

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Main generate method"""
        if not self.current_provider:
            raise RuntimeError("No AI provider configured. Check .env file.")

        if self.current_provider == "groq":
            return self._generate_groq(prompt, system_prompt)
        elif self.current_provider == "openai":
            return self._generate_openai(prompt, system_prompt)
        elif self.current_provider == "local":
            return self._generate_local(prompt)
        else:
            raise RuntimeError(f"Unknown provider: {self.current_provider}")

    def _generate_groq(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate using Groq"""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000,
                top_p=0.9
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise RuntimeError(f"Groq generation failed: {e}")

    def _generate_openai(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate using OpenAI"""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            else:
                messages.append({"role": "system", "content": "You are a helpful educational assistant."})
            
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise RuntimeError(f"OpenAI generation failed: {e}")

    def _generate_local(self, prompt: str) -> str:
        """Generate using Local LLM (Ollama)"""
        try:
            import requests
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            return response.json().get("response", "").strip()
        except Exception as e:
            raise RuntimeError(f"Local LLM generation failed: {e}")

    def parse_json_response(self, response: str) -> Any:
        """Parse JSON from AI response"""
        if not response:
            raise ValueError("Empty response from AI")

        # Remove markdown code blocks
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*', '', response)
        response = response.strip()

        # Try direct JSON parse
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        # Try to find JSON object {...}
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass

        # Try to find JSON array [...]
        match = re.search(r'\[.*\]', response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass

        raise ValueError(f"No valid JSON found in response: {response[:200]}")

    def is_available(self) -> bool:
        """Check if AI is configured and ready"""
        return self.current_provider is not None

    def get_model_name(self) -> str:
        """Get current model name"""
        return self.model or "Unknown"

    def get_available_providers(self) -> Dict[str, Any]:
        """Get provider status info"""
        return {
            "current": self.current_provider,
            "model": self.model,
            "available": self.is_available(),
            "providers": {
                "groq": os.getenv("GROQ_ENABLED", "true").lower() == "true",
                "openai": os.getenv("OPENAI_ENABLED", "false").lower() == "true",
                "local": os.getenv("LOCAL_LLM_ENABLED", "false").lower() == "true"
            }
        }


# Singleton instance
_ai_engine_instance: Optional[AIEngine] = None


def get_ai_engine() -> AIEngine:
    """Get or create the singleton AI engine instance"""
    global _ai_engine_instance
    if _ai_engine_instance is None:
        _ai_engine_instance = AIEngine()
    return _ai_engine_instance
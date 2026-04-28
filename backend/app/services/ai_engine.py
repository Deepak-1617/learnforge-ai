"""
AI ENGINE - CORE ABSTRACTION LAYER
===================================
LearnForge AI - All AI calls go through this single file.
To switch providers, only change this file.
"""

import os
import json
import re
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend folder
dotenv_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class AIEngine:
    def __init__(self):
        self.current_provider = None
        self.client = None
        self.model = None
        self._initialize_provider()

    def _initialize_provider(self):
        # Groq first (fast and free)
        if os.getenv("GROQ_ENABLED", "true").lower() == "true":
            self._setup_groq()
        elif os.getenv("GEMINI_ENABLED", "false").lower() == "true":
            self._setup_gemini()
        elif os.getenv("OPENAI_ENABLED", "false").lower() == "true":
            self._setup_openai()
        elif os.getenv("LOCAL_LLM_ENABLED", "false").lower() == "true":
            self._setup_local_llm()
        else:
            print("⚠️  No AI provider enabled.")

    def _setup_groq(self):
        try:
            from groq import Groq
            api_key = GROQ_API_KEY
            if not api_key:
                print("❌ GROQ_API_KEY not found")
                return
            self.client = Groq(api_key=api_key)
            self.current_provider = "groq"
            self.model = "llama-3.3-70b-versatile"
            print(f"✅ Groq AI initialized with model: {self.model}")
        except ImportError:
            print("❌ groq not installed. Run: pip install groq")
        except Exception as e:
            print(f"❌ Groq setup failed: {e}")

    def _setup_gemini(self):
        try:
            from google import genai
            api_key = GEMINI_API_KEY
            if not api_key:
                print("❌ GEMINI_API_KEY not found")
                return
            self.client = genai.Client(api_key=api_key)
            self.current_provider = "gemini"
            self.model = "gemini-1.5-flash"
            print(f"✅ Gemini AI initialized with model: {self.model}")
        except ImportError:
            print("❌ google-genai not installed. Run: pip install google-genai")
        except Exception as e:
            print(f"❌ Gemini setup failed: {e}")

    def _setup_openai(self):
        try:
            from openai import OpenAI
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                print("❌ OPENAI_API_KEY not found in .env")
                return
            self.client = OpenAI(api_key=api_key)
            self.current_provider = "openai"
            self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
            print(f"✅ OpenAI initialized with model: {self.model}")
        except ImportError:
            print("❌ openai not installed. Run: pip install openai")
        except Exception as e:
            print(f"❌ OpenAI setup failed: {e}")

    def _setup_local_llm(self):
        try:
            self.base_url = os.getenv("LOCAL_LLM_BASE_URL", "http://localhost:11434")
            self.model = os.getenv("LOCAL_LLM_MODEL", "llama2")
            self.current_provider = "local"
            print(f"✅ Local LLM initialized: {self.model} at {self.base_url}")
        except Exception as e:
            print(f"❌ Local LLM setup failed: {e}")

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.current_provider:
            raise RuntimeError("No AI provider configured. Check .env file.")
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        if self.current_provider == "groq":
            return self._generate_groq(prompt, system_prompt)
        elif self.current_provider == "gemini":
            return self._generate_gemini(full_prompt)
        elif self.current_provider == "openai":
            return self._generate_openai(full_prompt)
        elif self.current_provider == "local":
            return self._generate_local(full_prompt)
        else:
            raise RuntimeError(f"Unknown provider: {self.current_provider}")

    def _generate_groq(self, prompt: str, system_prompt: Optional[str] = None) -> str:
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
                max_tokens=2048
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise RuntimeError(f"Groq generation failed: {e}")

    def _generate_gemini(self, prompt: str) -> str:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            raise RuntimeError(f"Gemini generation failed: {e}")

    def _generate_openai(self, prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful educational assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise RuntimeError(f"OpenAI generation failed: {e}")

    def _generate_local(self, prompt: str) -> str:
        try:
            import requests
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": False}
            )
            return response.json().get("response", "").strip()
        except Exception as e:
            raise RuntimeError(f"Local LLM generation failed: {e}")

    def parse_json_response(self, response: str) -> Any:
        if not response:
            raise ValueError("Empty response from AI")
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*', '', response)
        response = response.strip()
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
        match = re.search(r'\[.*\]', response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
        raise ValueError(f"No valid JSON found in response: {response[:200]}")

    def is_available(self) -> bool:
        return self.current_provider is not None

    def get_model_name(self) -> str:
        return self.model or "Unknown"

    def get_available_providers(self) -> Dict[str, Any]:
        return {
            "current": self.current_provider,
            "model": self.model,
            "available": self.is_available(),
            "providers": {
                "groq": os.getenv("GROQ_ENABLED", "true").lower() == "true",
                "gemini": os.getenv("GEMINI_ENABLED", "false").lower() == "true",
                "openai": os.getenv("OPENAI_ENABLED", "false").lower() == "true",
                "local": os.getenv("LOCAL_LLM_ENABLED", "false").lower() == "true"
            }
        }


_ai_engine_instance: Optional[AIEngine] = None


def get_ai_engine() -> AIEngine:
    global _ai_engine_instance
    if _ai_engine_instance is None:
        _ai_engine_instance = AIEngine()
    return _ai_engine_instance
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend folder (resolve so cwd does not matter)
dotenv_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path, override=True, encoding="utf-8-sig")

from app.routes import upload, generate, content
from app.services.ai_engine import get_ai_engine

app = FastAPI(
    title="AI Learning Platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared state
ai_engine = get_ai_engine()
processed_content = {}
app.state.ai_engine = ai_engine
app.state.processed_content = processed_content

# ✅ API routes MUST come before static files mount
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "AI Learning Platform is running!"}

@app.get("/api/providers")
def get_available_providers():
    return ai_engine.get_available_providers()

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(generate.router, prefix="/api", tags=["Generate"])
app.include_router(content.router, prefix="/api", tags=["Content"])

# ✅ Static files LAST - so it doesn't swallow API routes
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
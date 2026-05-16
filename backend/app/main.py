# backend/app/main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cognixar")

# ── Import Routes ───────────────────────────────────────────────────────────────
# Ensure these files exist in backend/app/routes/
from app.routes import chat        # NEW: Stage 1 - AI Neural Tutor
from app.routes import upload      # EXISTING: File Upload
from app.routes import generate    # EXISTING: Content Generation (Quiz, etc.)

# ── Lifespan Events ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("🚀 COGNIXAR Neural Core starting up...")
    
    # Initialize AI Engine (warmup)
    try:
        from app.services.ai_engine import check_ai_health
        health = check_ai_health()
        logger.info(f"✅ AI Engine Status: {health.get('status', 'unknown')}")
        if health.get('status') == 'healthy':
            logger.info(f"   Model: {health.get('model')}")
        else:
            logger.warning(f"   ⚠️ Warning: {health.get('error')}")
    except Exception as e:
        logger.error(f"⚠️ AI Engine initialization warning: {e}")

    yield

    # Shutdown logic
    logger.info("🛑 COGNIXAR Neural Core shutting down...")

# ── FastAPI App ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="COGNIXAR API",
    description="AI-Powered Learning Platform Backend",
    version="2.1.0",
    lifespan=lifespan
)

# ── CORS Middleware ───────────────────────────────────────────────────────────────
# Allow frontend (and local development) to access the API
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # Add your production frontend URL here
    # "https://your-frontend-domain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # * allows all origins (relaxed for dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files ──────────────────────────────────────────────────────────────
# Your frontend files are in ../frontend/ folder
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")
    logger.info(f"📁 Serving static files from: {frontend_dir}")
else:
    logger.warning("⚠️ Frontend directory not found at: " + frontend_dir)

# ── Include Routers ───────────────────────────────────────────────────────────────
# Tags help organize the API documentation (/docs)

app.include_router(chat.router,     prefix="/api", tags=["Neural Tutor"])
app.include_router(upload.router,   prefix="/api", tags=["Upload"])
app.include_router(generate.router, prefix="/api", tags=["Generate"])

# ── Root & Health Endpoints ───────────────────────────────────────────────────────

from fastapi.responses import RedirectResponse, FileResponse

@app.get("/")
async def root():
    """Redirect to the main app page."""
    return RedirectResponse(url="/app.html")

@app.get("/api")
async def api_info():
    """API information endpoint."""
    return {
        "status": "COGNIXAR Neural Core Online",
        "version": "2.1.0",
        "features": [
            "document_processing",
            "quiz_generation",
            "flashcards",
            "neural_tutor_chat",
            "memory_tricks",
            "summaries"
        ],
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "operational", "core": "active"}

@app.get("/app.html")
async def serve_app():
    """Serve the main application page."""
    app_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "frontend", "app.html"
    )
    if os.path.exists(app_path):
        return FileResponse(app_path)
    return {"error": "app.html not found"}

@app.get("/index.html")
async def serve_index():
    """Serve the landing page."""
    index_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "frontend", "index.html"
    )
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "index.html not found"}

@app.get("/api/providers")
async def get_providers():
    """
    Return AI provider status.
    Frontend calls this to check if AI is available.
    """
    try:
        from app.services.ai_engine import get_ai_engine
        
        # Quick health check
        engine = get_ai_engine()
        health = engine.check_health()
        
        is_healthy = health.get("status") == "healthy"
        
        return {
            "available": is_healthy,
            "current": "groq" if is_healthy else None,
            "model": health.get("model", "llama-3.3-70b-versatile"),
            "providers": {
                "groq": {
                    "enabled": is_healthy,
                    "model": health.get("model", "llama-3.3-70b-versatile"),
                    "status": health.get("status", "unknown")
                }
            }
        }
    except Exception as e:
        logger.error(f"Provider check failed: {e}")
        return {
            "available": False,
            "current": None,
            "model": None,
            "error": str(e)
        }

# ── Note on running the app ───────────────────────────────────────────────────────
# To run this server:
# 1. Ensure dependencies are installed: pip install fastapi uvicorn groq python-dotenv
# 2. Set your GROQ_API_KEY in the .env file
# 3. Run: python -m uvicorn app.main:app --reload --port 8000
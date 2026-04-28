import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from app.services.chunker import chunk_text
from app.services.quiz_generator import generate_quiz_chunk, merge_quizzes
from app.services.flashcard_generator import generate_flashcards_chunk, merge_flashcards
from app.services.tricks_generator import generate_tricks_chunk, merge_tricks
from app.services.ai_engine import get_ai_engine
from app.storage import uploaded_files

router = APIRouter()

class GenerateRequest(BaseModel):
    file_id: str
    content_type: str
    custom_prompt: Optional[str] = None

@router.post("/generate")
async def generate_content(request: GenerateRequest):
    ai_engine = get_ai_engine()

    if not ai_engine.is_available():
        raise HTTPException(status_code=503, detail="AI not configured.")

    if request.file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found. Please upload a file first.")

    file_data = uploaded_files[request.file_id]
    full_text = file_data["text"]
    chunks = chunk_text(full_text, chunk_size=800, overlap=50)
    chunks = chunks[:2]

    results = {
        "file_id": request.file_id,
        "content_type": request.content_type,
        "chunks_processed": len(chunks)
    }

    try:
        if request.content_type in ["quiz", "all"]:
            quiz_results = []
            for i, chunk in enumerate(chunks):
                quiz = await generate_quiz_chunk(chunk, ai_engine, request.custom_prompt)
                quiz_results.append(quiz)
                if i < len(chunks) - 1:
                    await asyncio.sleep(2)
            results["quizzes"] = merge_quizzes(quiz_results)

        if request.content_type in ["flashcards", "all"]:
            await asyncio.sleep(2)
            flashcard_results = []
            for i, chunk in enumerate(chunks):
                cards = await generate_flashcards_chunk(chunk, ai_engine, request.custom_prompt)
                flashcard_results.append(cards)
                if i < len(chunks) - 1:
                    await asyncio.sleep(2)
            results["flashcards"] = merge_flashcards(flashcard_results)

        if request.content_type in ["tricks", "all"]:
            await asyncio.sleep(2)
            tricks_results = []
            for i, chunk in enumerate(chunks):
                tricks = await generate_tricks_chunk(chunk, ai_engine, request.custom_prompt)
                tricks_results.append(tricks)
                if i < len(chunks) - 1:
                    await asyncio.sleep(2)
            results["tricks"] = merge_tricks(tricks_results)

        if request.content_type in ["summary", "all"]:
            await asyncio.sleep(2)
            from app.services.summary_generator import generate_summary
            results["summary"] = await generate_summary(
                full_text[:2000], ai_engine, request.custom_prompt
            )

        # Compare & Contrast (always generated with "all")
        if request.content_type in ["compare", "all"]:
            await asyncio.sleep(2)
            from app.services.compare_generator import generate_compare
            results["compare"] = await generate_compare(
                full_text[:3000], ai_engine, request.custom_prompt
            )

        results["success"] = True
        results["message"] = "Generated successfully"

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

    return JSONResponse(content=results)

@router.get("/generate/status")
async def get_generation_status():
    ai_engine = get_ai_engine()
    return {
        "provider": ai_engine.current_provider,
        "is_available": ai_engine.is_available(),
        "model": ai_engine.get_model_name()
    }
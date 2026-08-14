import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from app.services.ai_engine import get_ai_engine

router = APIRouter(tags=["chat"])


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    document_text: Optional[str] = ""
    conversation_history: Optional[List[Message]] = []
    file_name: Optional[str] = "the uploaded document"


class ChatResponse(BaseModel):
    response: str
    tokens_used: Optional[int] = None


def build_system_prompt(document_text: str, file_name: str) -> str:
    max_doc_length = 3000
    truncated = document_text[:max_doc_length] if document_text else ""
    truncation_note = "\n[Document truncated.]" if len(document_text) > max_doc_length else ""

    if truncated:
        return f"""You are COGNIXAR Neural Tutor, an elite AI learning assistant.

The user uploaded "{file_name}". Here is the content:

---DOCUMENT START---
{truncated}{truncation_note}
---DOCUMENT END---

Rules:
- Answer based on the document content
- Use bullet points and structure for clarity
- Give concrete examples when explaining
- Keep responses 150-300 words unless more detail is needed
- Use markdown: **bold**, *italic*, ## headers
- Never make up facts"""
    else:
        return """You are COGNIXAR Neural Tutor, an elite AI learning assistant.
No document uploaded yet. Encourage the user to upload one and answer general study questions."""


async def stream_response(message, document_text, file_name, conversation_history):
    """Stream response using ai_engine (Groq → Cerebras fallback)."""
    try:
        engine = get_ai_engine()

        messages = [{"role": "system", "content": build_system_prompt(document_text, file_name)}]

        for msg in (conversation_history or [])[-10:]:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": message})

        # Run generation in thread (sync client)
        import asyncio
        loop = asyncio.get_event_loop()
        response_text = await loop.run_in_executor(
            None,
            lambda: engine._generate(messages, max_tokens=1024)
        )

        # Stream word by word for typewriter effect
        words = response_text.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == len(words) - 1 else word + " "
            yield f"data: {json.dumps({'type': 'content', 'text': chunk})}\n\n"
            await asyncio.sleep(0.02)

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(request.message) > 2000:
        raise HTTPException(status_code=400, detail="Message too long.")

    return StreamingResponse(
        stream_response(
            message=request.message.strip(),
            document_text=request.document_text or "",
            file_name=request.file_name or "your document",
            conversation_history=request.conversation_history or []
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_standard(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        engine = get_ai_engine()
        messages = [{"role": "system", "content": build_system_prompt(
            request.document_text or "", request.file_name or "your document"
        )}]

        for msg in (request.conversation_history or [])[-10:]:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": request.message.strip()})

        response_text = engine._generate(messages, max_tokens=1024)

        return ChatResponse(response=response_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@router.get("/chat/health")
async def chat_health():
    engine = get_ai_engine()
    return {
        "status": "active",
        "service": "COGNIXAR Neural Tutor",
        "model": engine.model,
        "streaming": True
    }
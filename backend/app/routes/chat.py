# backend/app/routes/chat.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio
from app.services.ai_engine import get_groq_client

router = APIRouter(tags=["chat"])


class Message(BaseModel):
    role: str  # "user" or "assistant"
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
    """Build the system prompt with document context."""
    
    # Truncate document to avoid token limits (keep ~3000 chars)
    max_doc_length = 3000
    truncated_text = document_text[:max_doc_length] if document_text else ""
    truncation_note = ""
    
    if len(document_text) > max_doc_length:
        truncation_note = "\n[Note: Document truncated for context window. Focus on the provided section.]"
    
    if truncated_text:
        return f"""You are COGNIXAR Neural Tutor, an elite AI learning assistant with expertise across all academic subjects.

The user has uploaded a document called "{file_name}". Here is the document content:

---DOCUMENT START---
{truncated_text}{truncation_note}
---DOCUMENT END---

YOUR PERSONALITY:
- You are encouraging, enthusiastic, and make learning feel exciting
- You use clear explanations with real-world examples
- You adapt complexity to the user's apparent level
- You celebrate understanding and progress
- You speak in a slightly futuristic, professional tone

YOUR RULES:
1. Answer questions based primarily on the uploaded document
2. If asked something outside the document scope, briefly acknowledge and provide general knowledge
3. Use bullet points, numbered lists, and structure for clarity
4. When explaining concepts, always give at least one concrete example
5. Keep responses concise but complete (aim for 150-300 words unless detail is needed)
6. Use markdown formatting: **bold**, *italic*, `code`, ## headers
7. End responses with an encouraging note or follow-up question when appropriate
8. NEVER make up facts — if unsure, say so clearly

SPECIAL COMMANDS (recognize these from users):
- "Summarize this section" → Provide a structured summary
- "Explain like I'm 5" → Use very simple language and analogies
- "Give examples" → Provide 3-5 concrete, relatable examples
- "Quiz me on this" → Create 3 multiple choice questions from the content"""
    else:
        return """You are COGNIXAR Neural Tutor, an elite AI learning assistant.

No document has been uploaded yet. Help the user by:
1. Encouraging them to upload a document to get personalized assistance
2. Answering general learning and study-related questions
3. Explaining how COGNIXAR can help them learn more effectively

Be encouraging, professional, and enthusiastic about learning."""


async def generate_streaming_response(
    message: str,
    document_text: str,
    file_name: str,
    conversation_history: List[Message]
):
    """Generate streaming response using Groq AI."""
    try:
        client = get_groq_client()
        
        # Build messages array
        messages = [
            {
                "role": "system",
                "content": build_system_prompt(document_text, file_name)
            }
        ]
        
        # Add conversation history (last 10 messages to stay within limits)
        history_to_include = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        
        for msg in history_to_include:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": message
        })
        
        # Create streaming completion
        stream = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
            stream=True
        )
        
        # Stream the response
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                # Format as SSE
                data = json.dumps({"type": "content", "text": content})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0)  # Allow other coroutines to run
        
        # Send completion signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        
    except Exception as e:
        error_data = json.dumps({
            "type": "error",
            "message": f"Neural link disrupted: {str(e)}"
        })
        yield f"data: {error_data}\n\n"


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint using Server-Sent Events.
    Returns streamed AI response for real-time typewriter effect.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    if len(request.message) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message too long. Maximum 2000 characters."
        )
    
    return StreamingResponse(
        generate_streaming_response(
            message=request.message.strip(),
            document_text=request.document_text or "",
            file_name=request.file_name or "your document",
            conversation_history=request.conversation_history or []
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Access-Control-Allow-Origin": "*",
        }
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_standard(request: ChatRequest):
    """
    Standard (non-streaming) chat endpoint.
    Falls back option if SSE is not supported.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        client = get_groq_client()
        
        messages = [
            {
                "role": "system",
                "content": build_system_prompt(
                    request.document_text or "",
                    request.file_name or "your document"
                )
            }
        ]
        
        # Add history (last 10)
        history = request.conversation_history or []
        for msg in history[-10:]:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        messages.append({
            "role": "user",
            "content": request.message.strip()
        })
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
            stream=False
        )
        
        response_text = completion.choices[0].message.content
        tokens_used = completion.usage.total_tokens if completion.usage else None
        
        return ChatResponse(
            response=response_text,
            tokens_used=tokens_used
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI Engine error: {str(e)}"
        )


@router.get("/chat/health")
async def chat_health():
    """Health check for chat service."""
    return {
        "status": "neural_link_active",
        "service": "COGNIXAR Neural Tutor",
        "model": "llama-3.3-70b-versatile",
        "streaming": True
    }
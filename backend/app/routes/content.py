"""
Content Routes
Retrieve processed content and results
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/content/{file_id}")
async def get_content(file_id: str):
    """
    Get all generated content for a file.

    Args:
        file_id: The ID of the uploaded file

    Returns:
        All generated content (quizzes, flashcards, tricks, summary)
    """
    from app.main import app

    # Get the processed content store
    processed = getattr(app.state, 'processed_content', {})

    if file_id not in processed:
        raise HTTPException(status_code=404, detail="Content not found")

    return JSONResponse(content=processed[file_id])


@router.get("/content")
async def list_all_content():
    """List all processed content IDs"""
    from app.main import app

    processed = getattr(app.state, 'processed_content', {})

    return {
        "files": list(processed.keys()),
        "count": len(processed)
    }

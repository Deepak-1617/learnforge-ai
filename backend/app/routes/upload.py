from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
from app.services.extractor import extract_text_from_file
from app.storage import uploaded_files

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    try:
        file_content = await file.read()
        extracted_text = extract_text_from_file(file_content, file_ext)

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the file."
            )

        file_id = str(uuid.uuid4())

        # Save to shared storage
        uploaded_files[file_id] = {
            "filename": file.filename,
            "file_type": file_ext,
            "text": extracted_text,
            "char_count": len(extracted_text)
        }

        preview = extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text

        return JSONResponse(content={
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "preview": preview,
            "char_count": len(extracted_text),
            "message": "File uploaded successfully!"
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/files/{file_id}")
async def get_file_info(file_id: str):
    if file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found")
    file_info = uploaded_files[file_id]
    return {
        "file_id": file_id,
        "filename": file_info["filename"],
        "file_type": file_info["file_type"],
        "char_count": file_info["char_count"]
    }
"""
TEXT EXTRACTOR SERVICE
======================
Extracts text from different file formats (PDF, DOCX, TXT)

Uses different libraries for each format:
- PDF: pdfplumber (better accuracy than PyPDF2)
- DOCX: python-docx
- TXT: Direct reading
"""

import io
from typing import Union


def extract_text_from_file(file_content: bytes, file_extension: str) -> str:
    """
    Extract text from uploaded file.

    Args:
        file_content: Raw bytes of the file
        file_extension: File extension (.pdf, .docx, .txt)

    Returns:
        Extracted text content
    """
    if file_extension == ".pdf":
        return _extract_from_pdf(file_content)
    elif file_extension == ".docx":
        return _extract_from_docx(file_content)
    elif file_extension == ".txt":
        return _extract_from_txt(file_content)
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")


def _extract_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF using pdfplumber"""
    try:
        import pdfplumber
    except ImportError:
        raise ImportError("pdfplumber not installed. Run: pip install pdfplumber")

    text = ""
    with pdfplumber.open(io.BytesIO(file_content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def _extract_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX using python-docx"""
    try:
        from docx import Document
    except ImportError:
        raise ImportError("python-docx not installed. Run: pip install python-docx")

    doc = Document(io.BytesIO(file_content))
    text = ""
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            text += paragraph.text + "\n"
    return text.strip()


def _extract_from_txt(file_content: bytes) -> str:
    """Read text from TXT file directly"""
    # Try UTF-8 first, fallback to other encodings
    encodings = ['utf-8', 'latin-1', 'cp1252']

    for encoding in encodings:
        try:
            return file_content.decode(encoding).strip()
        except UnicodeDecodeError:
            continue

    # If all encodings fail, decode with errors ignored
    return file_content.decode('utf-8', errors='ignore').strip()


def clean_text(text: str) -> str:
    """
    Clean extracted text by removing extra whitespace and special characters.

    Args:
        text: Raw extracted text

    Returns:
        Cleaned text
    """
    import re

    # Remove multiple spaces/newlines
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r' +', ' ', text)

    # Remove common artifacts
    text = text.replace('﻿', '')  # BOM character
    text = text.replace('\xa0', ' ')   # Non-breaking space

    return text.strip()

"""
TEXT CHUNKER SERVICE
====================
Splits large text into manageable chunks for AI processing.

Why chunking?
- AI models have token limits
- Smaller chunks = more focused, accurate results
- Easier to merge results from multiple chunks

Strategy: Overlapping chunks to maintain context
"""

import re
from typing import List


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50,
    min_chunk_size: int = 100
) -> List[str]:
    """
    Split text into overlapping chunks.

    Args:
        text: The text to chunk
        chunk_size: Target size of each chunk (in characters)
        overlap: Number of characters to overlap between chunks
        min_chunk_size: Minimum size for a valid chunk

    Returns:
        List of text chunks
    """
    if not text or len(text.strip()) == 0:
        return []

    # If text is small enough, return as single chunk
    if len(text) <= chunk_size:
        return [text.strip()]

    chunks = []

    # Try to split at sentence boundaries first
    sentences = _split_into_sentences(text)

    current_chunk = ""
    for sentence in sentences:
        # If adding this sentence exceeds chunk size
        if len(current_chunk) + len(sentence) > chunk_size and current_chunk:
            # Save current chunk if it's big enough
            if len(current_chunk) >= min_chunk_size:
                chunks.append(current_chunk.strip())
            # Start new chunk with overlap from previous
            current_chunk = _get_overlap_text(current_chunk, overlap) + sentence
        else:
            current_chunk += " " + sentence if current_chunk else sentence

    # Don't forget the last chunk
    if current_chunk and len(current_chunk.strip()) >= min_chunk_size:
        chunks.append(current_chunk.strip())

    # If chunking by sentences didn't work well, fall back to character-based
    if len(chunks) == 0 or (len(chunks) == 1 and len(chunks[0]) > chunk_size * 1.5):
        chunks = _chunk_by_characters(text, chunk_size, overlap, min_chunk_size)

    return chunks


def _split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences.
    Simple regex-based approach (good enough for most cases).
    """
    # Split on common sentence endings
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def _chunk_by_characters(
    text: str,
    chunk_size: int,
    overlap: int,
    min_chunk_size: int
) -> List[str]:
    """
    Fallback: Chunk by characters when sentence splitting fails.
    Tries to break at paragraph or word boundaries.
    """
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # If we're at the end, take remaining text
        if end >= len(text):
            chunk = text[start:].strip()
            if len(chunk) >= min_chunk_size:
                chunks.append(chunk)
            break

        # Try to break at paragraph boundary
        chunk = text[start:end]
        last_break = chunk.rfind('\n\n')

        # If no paragraph, try word boundary
        if last_break == -1:
            last_break = chunk.rfind(' ')

        # Adjust end position
        if last_break > chunk_size // 2:
            end = start + last_break

        chunk = text[start:end].strip()
        if len(chunk) >= min_chunk_size:
            chunks.append(chunk)

        # Move start position (with overlap)
        start = end - overlap

    return chunks


def _get_overlap_text(text: str, overlap: int) -> str:
    """
    Get the last portion of text for overlap.
    Tries to break at a word boundary.
    """
    if len(text) <= overlap:
        return text

    overlap_text = text[-overlap:]

    # Try to find a space to break at word boundary
    space_idx = overlap_text.find(' ')
    if space_idx != -1 and space_idx < overlap // 2:
        return overlap_text[space_idx:]

    return overlap_text

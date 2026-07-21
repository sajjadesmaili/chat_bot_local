import re


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 150) -> list[str]:
    """Split text into overlapping chunks, preferring paragraph boundaries.

    Paragraphs are accumulated until `chunk_size` (characters) would be
    exceeded, then a new chunk starts, carrying over the last `chunk_overlap`
    characters of the previous chunk for context continuity. Paragraphs
    longer than `chunk_size` are hard-split with a sliding window.
    """
    text = text.strip()
    if not text:
        return []

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        if len(paragraph) > chunk_size:
            if current:
                chunks.append(current.strip())
                current = current[-chunk_overlap:] if chunk_overlap > 0 else ""
            chunks.extend(_split_long_paragraph(paragraph, chunk_size, chunk_overlap))
            current = ""
            continue

        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            chunks.append(current.strip())
            overlap_tail = current[-chunk_overlap:] if chunk_overlap > 0 else ""
            current = f"{overlap_tail}\n\n{paragraph}".strip() if overlap_tail else paragraph

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if c.strip()]


def _split_long_paragraph(paragraph: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    chunks = []
    start = 0
    length = len(paragraph)
    step = max(chunk_size - chunk_overlap, 1)
    while start < length:
        end = min(start + chunk_size, length)
        chunks.append(paragraph[start:end])
        if end == length:
            break
        start += step
    return chunks

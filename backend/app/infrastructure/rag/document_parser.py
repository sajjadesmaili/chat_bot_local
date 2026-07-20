import csv
from pathlib import Path

from docx import Document as DocxDocument
from pypdf import PdfReader

SUPPORTED_TYPES = {"pdf", "docx", "txt", "md", "csv"}


def parse_document(file_path: str, file_type: str) -> str:
    """Extract plain text from a stored upload for chunking/embedding.

    PDF/DOCX/CSV get dedicated parsers; TXT/MD and any code file
    (py/js/ts/java/c/cpp/go/rs/json/yaml/html/css/sql/...) fall back to a
    plain-text read, which is exactly what we want for source code.
    """
    file_type = file_type.lower().lstrip(".")
    path = Path(file_path)

    if file_type == "pdf":
        return _parse_pdf(path)
    if file_type == "docx":
        return _parse_docx(path)
    if file_type == "csv":
        return _parse_csv(path)
    return _parse_plain_text(path)


def _parse_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def _parse_docx(path: Path) -> str:
    document = DocxDocument(str(path))
    return "\n\n".join(paragraph.text for paragraph in document.paragraphs if paragraph.text.strip())


def _parse_csv(path: Path) -> str:
    lines: list[str] = []
    with open(path, "r", encoding="utf-8", errors="ignore", newline="") as handle:
        reader = csv.reader(handle)
        header = next(reader, None)
        if header:
            for row in reader:
                pairs = [f"{col}: {val}" for col, val in zip(header, row)]
                lines.append(", ".join(pairs))
    return "\n".join(lines)


def _parse_plain_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")

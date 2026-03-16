from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf_bytes(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    text_parts = [(page.extract_text() or "").strip() for page in reader.pages]
    return "\n\n".join(part for part in text_parts if part).strip()

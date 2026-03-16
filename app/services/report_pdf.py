from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


def markdown_to_pdf_bytes(markdown_text: str) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin_x = 2 * cm
    margin_top = 2 * cm
    line_height = 14
    y = height - margin_top

    pdf.setTitle("Relatorio de Aderencia")
    pdf.setFont("Helvetica", 11)

    for raw_line in markdown_text.splitlines():
        line = raw_line.strip()
        if line.startswith("# "):
            pdf.setFont("Helvetica-Bold", 16)
            line = line[2:]
        elif line.startswith("## "):
            pdf.setFont("Helvetica-Bold", 13)
            line = line[3:]
        elif line.startswith("### "):
            pdf.setFont("Helvetica-Bold", 12)
            line = line[4:]
        else:
            pdf.setFont("Helvetica", 11)
            if line.startswith("- "):
                line = f"• {line[2:]}"

        max_width = width - (2 * margin_x)
        for fragment in _wrap_line(line, max_width, pdf._fontname, pdf._fontsize):
            if y < 2 * cm:
                pdf.showPage()
                y = height - margin_top
                pdf.setFont("Helvetica", 11)
            pdf.drawString(margin_x, y, fragment)
            y -= line_height

        if not line:
            y -= 4

    pdf.save()
    buffer.seek(0)
    return buffer.read()


def _wrap_line(text: str, max_width: float, font_name: str, font_size: float) -> list[str]:
    if not text:
        return [""]
    words = text.split(" ")
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

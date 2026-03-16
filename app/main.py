from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from app.core.models import AnalyzeRequest, AnalyzeResponse
from app.services.analyzer import analyze_resume_vs_job
from app.services.pdf_extractor import extract_text_from_pdf_bytes
from app.services.report_pdf import markdown_to_pdf_bytes
from app.services.storage import get_analysis, init_db, list_analyses, save_analysis

app = FastAPI(
    title="CareerFit RAG Engine API",
    description="API MVP para analise de aderencia entre curriculo e vaga.",
    version="0.1.0",
)

WEB_DIR = Path(__file__).resolve().parent / "web"
if WEB_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(WEB_DIR), html=False), name="static")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def web_home() -> FileResponse:
    index_file = WEB_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend nao encontrado.")
    return FileResponse(index_file)


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    result = analyze_resume_vs_job(
        resume_text=payload.resume_text,
        job_description=payload.job_description,
        target_role=payload.target_role,
    )
    analysis_id = save_analysis(result, payload.target_role)
    saved = get_analysis(analysis_id)
    if not saved:
        raise HTTPException(status_code=500, detail="Falha ao salvar analise.")
    return saved


@app.post("/api/v1/analyze/pdf", response_model=AnalyzeResponse)
async def analyze_pdf(
    resume_pdf: UploadFile = File(...),
    job_description: str = Form(...),
    target_role: str | None = Form(default=None),
) -> AnalyzeResponse:
    if not resume_pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Arquivo precisa ser PDF.")

    content = await resume_pdf.read()
    resume_text = extract_text_from_pdf_bytes(content)
    if len(resume_text) < 30:
        raise HTTPException(status_code=400, detail="Nao foi possivel extrair texto util do PDF.")

    result = analyze_resume_vs_job(
        resume_text=resume_text,
        job_description=job_description,
        target_role=target_role,
    )
    analysis_id = save_analysis(result, target_role)
    saved = get_analysis(analysis_id)
    if not saved:
        raise HTTPException(status_code=500, detail="Falha ao salvar analise.")
    return saved


@app.get("/api/v1/analyses")
def get_analyses(limit: int = Query(default=20, ge=1, le=100)) -> list[dict]:
    return list_analyses(limit=limit)


@app.get("/api/v1/analyses/{analysis_id}", response_model=AnalyzeResponse)
def get_analysis_by_id(analysis_id: str) -> AnalyzeResponse:
    result = get_analysis(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analise nao encontrada.")
    return result


@app.get("/api/v1/analyses/{analysis_id}/report.pdf")
def get_analysis_report_pdf(analysis_id: str) -> Response:
    result = get_analysis(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analise nao encontrada.")

    pdf_bytes = markdown_to_pdf_bytes(result.report_markdown)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="analise-{analysis_id}.pdf"'},
    )

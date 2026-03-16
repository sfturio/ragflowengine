from app.services.analyzer import analyze_resume_vs_job, extract_skills
from app.services.rag_engine import build_index, search


def test_extract_skills_detects_known_terms() -> None:
    text = "Buscamos backend com Python, FastAPI, PostgreSQL e Docker."
    found = extract_skills(text)
    assert "python" in found
    assert "fastapi" in found
    assert "postgresql" in found
    assert "docker" in found


def test_analyze_returns_score_and_missing_skills() -> None:
    resume = "Experiencia com Python, FastAPI, PostgreSQL e GitHub Actions."
    job = "Vaga para backend com Python, FastAPI, AWS, Docker e CI/CD."
    result = analyze_resume_vs_job(resume_text=resume, job_description=job, target_role="Backend")

    assert result.match_score > 0
    assert result.weighted_match_score > 0
    assert "python" in result.matched_skills
    assert "aws" in result.missing_skills
    assert len(result.study_plan) >= 1
    assert "# Relatorio de Aderencia" in result.report_markdown


def test_extract_skills_handles_dotnet_aliases() -> None:
    text = (
        "Conhecimento em C# e plataforma .NET, ASP.NET Core, Entity Framework, "
        "SQL Server, APIs REST e Clean Code."
    )
    found = extract_skills(text)
    assert "c#" in found
    assert ".net" in found
    assert "asp.net core" in found
    assert "entity framework" in found
    assert "sql server" in found
    assert "rest api" in found
    assert "clean code" in found


def test_weighted_score_prioritizes_requirements_section() -> None:
    resume = "Experiencia com C#, .NET, APIs REST, Git e SQL."
    job = """
    Requisitos
    Conhecimento em C#, .NET, APIs REST e SQL Server
    Diferenciais
    Azure e microservicos
    """
    result = analyze_resume_vs_job(resume_text=resume, job_description=job, target_role="Backend .NET")
    assert result.match_score < result.weighted_match_score


def test_rag_engine_returns_relevant_chunk() -> None:
    text = "Projeto com ASP.NET Core e Entity Framework para API de pagamentos."
    index = build_index(text)
    hits = search(index, "entity framework api", top_k=1)
    assert hits
    assert "entity framework" in hits[0][0].text.lower()


def test_breakdown_contains_rag_evidence_for_present_skill() -> None:
    resume = "Experiencia com Python, FastAPI e PostgreSQL em sistema backend."
    job = "Requisitos: Python, FastAPI e SQL."
    result = analyze_resume_vs_job(resume_text=resume, job_description=job, target_role="Backend")
    python_item = next(item for item in result.skill_breakdown if item.skill == "python")
    assert python_item.present_in_resume is True
    assert python_item.evidence is not None
    assert "python" in python_item.evidence.lower()

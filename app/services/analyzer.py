from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
import unicodedata
from collections import OrderedDict

from app.core.settings import settings
from app.core.models import AnalyzeResponse, SkillMatch, StudyItem
from app.services.rag_engine import build_index, search


SKILL_PATTERNS: dict[str, list[str]] = {
    "c#": [r"(?<!\w)c#(?!\w)", r"\bcsharp\b"],
    ".net": [r"\.net\b", r"\bdotnet\b", r"\basp\.net\b", r"\baspnet\b"],
    "asp.net core": [r"\basp\.net core\b", r"\baspnet core\b"],
    "entity framework": [r"\bentity framework\b", r"\bef core\b"],
    "sql": [r"\bsql\b"],
    "sql server": [r"\bsql server\b", r"\bmssql\b"],
    "postgresql": [r"\bpostgresql\b", r"\bpostgres\b"],
    "mysql": [r"\bmysql\b"],
    "mongodb": [r"\bmongodb\b"],
    "python": [r"\bpython\b"],
    "fastapi": [r"\bfastapi\b"],
    "django": [r"\bdjango\b"],
    "flask": [r"\bflask\b"],
    "docker": [r"\bdocker\b"],
    "kubernetes": [r"\bkubernetes\b", r"\bk8s\b"],
    "aws": [r"\baws\b", r"\bamazon web services\b"],
    "azure": [r"\bazure\b"],
    "gcp": [r"\bgcp\b", r"\bgoogle cloud\b"],
    "ci/cd": [r"\bci\/cd\b", r"\bci cd\b", r"\bcontinuous integration\b"],
    "github actions": [r"\bgithub actions\b"],
    "gitlab ci": [r"\bgitlab ci\b"],
    "pytest": [r"\bpytest\b"],
    "unit testing": [r"\bunit test", r"\btestes automatizados\b"],
    "rest api": [r"\brest api\b", r"\bapis rest\b", r"\bapi rest\b"],
    "microservices": [r"\bmicroservices\b", r"\bmicroservicos\b"],
    "clean code": [r"\bclean code\b"],
    "clean architecture": [r"\bclean architecture\b", r"\barquitetura limpa\b"],
    "layered architecture": [r"\barquitetura em camadas\b", r"\blayered architecture\b"],
    "oop": [r"\borientacao a objetos\b", r"\boop\b", r"\bobject oriented\b"],
    "git": [r"\bgit\b"],
    "redis": [r"\bredis\b"],
    "langchain": [r"\blangchain\b"],
    "llamaindex": [r"\bllamaindex\b"],
    "rag": [r"\brag\b", r"\bretrieval augmented generation\b"],
    "machine learning": [r"\bmachine learning\b"],
    "nlp": [r"\bnlp\b", r"\bprocessamento de linguagem natural\b"],
}

RESOURCES_BY_SKILL: dict[str, list[str]] = {
    "c#": ["Microsoft Learn - C#", "C# Fundamentals for Absolute Beginners"],
    ".net": ["Microsoft Learn - .NET", ".NET documentation"],
    "asp.net core": ["ASP.NET Core docs", "Minimal APIs and MVC tutorials"],
    "entity framework": ["EF Core docs", "EF Core in Action"],
    "sql server": ["SQL Server docs", "T-SQL fundamentals"],
    "aws": ["AWS Skill Builder", "AWS Well-Architected Framework"],
    "azure": ["Microsoft Learn - Azure", "Azure Architecture Center"],
    "docker": ["Docker Docs", "Play with Docker"],
    "kubernetes": ["Kubernetes Docs", "Kubernetes Basics"],
    "ci/cd": ["GitHub Actions Docs", "CI/CD Best Practices (Atlassian)"],
    "clean code": ["Clean Code (Robert C. Martin)", "Refactoring Guru"],
    "microservices": ["Microservices patterns", "Microsoft microservices guidance"],
    "pytest": ["Pytest Docs", "Test-Driven Development by Example"],
    "langchain": ["LangChain Docs", "LangChain Cookbook"],
    "llamaindex": ["LlamaIndex Docs", "RAG with LlamaIndex examples"],
    "rag": ["Pinecone Learn - RAG", "OpenAI cookbook (RAG patterns)"],
}

SECTION_WEIGHTS: dict[str, tuple[str, float]] = {
    "requisitos": ("requisitos", 1.0),
    "requirements": ("requisitos", 1.0),
    "atribuicoes principais": ("atribuicoes", 0.85),
    "responsabilidades": ("atribuicoes", 0.85),
    "diferenciais": ("diferenciais", 0.55),
    "nice to have": ("diferenciais", 0.55),
}


def _normalize(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"\s+", " ", text)
    return text


def _has_skill(text: str, skill: str) -> bool:
    patterns = SKILL_PATTERNS.get(skill, [rf"\b{re.escape(skill)}\b"])
    return any(re.search(pattern, text) for pattern in patterns)


def extract_skills(text: str) -> list[str]:
    normalized = _normalize(text)
    found = [skill for skill in SKILL_PATTERNS if _has_skill(normalized, skill)]
    return sorted(set(found))


def _extract_weighted_job_skills(job_description: str) -> list[tuple[str, float, str]]:
    lines = [line.strip() for line in job_description.splitlines() if line.strip()]
    current_section = "geral"
    current_weight = 0.75
    weighted: dict[str, tuple[float, str]] = {}

    for line in lines:
        normalized_line = _normalize(line)
        for section_key, (section_name, section_weight) in SECTION_WEIGHTS.items():
            if section_key in normalized_line:
                current_section = section_name
                current_weight = section_weight

        skills_in_line = extract_skills(line)
        for skill in skills_in_line:
            previous = weighted.get(skill)
            if not previous or current_weight > previous[0]:
                weighted[skill] = (current_weight, current_section)

    if not weighted:
        for skill in extract_skills(job_description) or ["python", "sql", "rest api"]:
            weighted[skill] = (1.0, "geral")

    return [(skill, data[0], data[1]) for skill, data in sorted(weighted.items())]


def _build_skill_breakdown(
    required_skills: list[tuple[str, float, str]], resume_text: str
) -> list[SkillMatch]:
    normalized_resume = _normalize(resume_text)
    rag_index = build_index(resume_text)
    breakdown: list[SkillMatch] = []
    for skill, weight, section in required_skills:
        lexical_present = _has_skill(normalized_resume, skill)
        query = f"experiencia com {skill} em projetos backend"
        top_hits = search(rag_index, query=query, top_k=3)
        best_hit = None
        for hit in top_hits:
            if _has_skill(_normalize(hit[0].text), skill):
                best_hit = hit
                break
        if not best_hit and top_hits:
            best_hit = top_hits[0]
        semantic_score = best_hit[1] if best_hit else 0.0
        present = lexical_present

        evidence = None
        evidence_chunk = None
        evidence_score = None
        if present and best_hit and semantic_score >= 0.08:
            excerpt = _build_relevant_evidence_summary(best_hit[0].text, skill)
            evidence = excerpt
            evidence_chunk = best_hit[0].chunk_id
            evidence_score = round(semantic_score, 2)
        elif present:
            evidence = f"Mencao encontrada para '{skill}'."

        breakdown.append(
            SkillMatch(
                skill=skill,
                present_in_resume=present,
                weight=weight,
                source_section=section,
                evidence=evidence,
                evidence_chunk=evidence_chunk,
                evidence_score=evidence_score,
            )
        )
    return breakdown


def _excerpt_around_skill(
    text: str, skill: str, max_len: int = 180, include_ellipsis: bool = True
) -> str:
    raw = re.sub(r"\s+", " ", text).strip()
    if len(raw) <= max_len:
        return raw

    lowered_raw = raw.lower()
    patterns = SKILL_PATTERNS.get(skill, [re.escape(skill)])
    match_start = -1
    match_end = -1

    # Prefer exact match on raw text to keep offsets reliable.
    for pattern in patterns:
        match = re.search(pattern, lowered_raw)
        if match:
            match_start, match_end = match.start(), match.end()
            break

    if match_start < 0:
        # Fallback to the beginning, but avoid breaking mid-word.
        cut = raw[:max_len]
        last_space = cut.rfind(" ")
        snippet = (cut[:last_space] if last_space > 0 else cut).rstrip()
        if include_ellipsis and len(raw) > len(snippet):
            return snippet + "..."
        return snippet

    center = (match_start + match_end) // 2
    left = max(0, center - max_len // 2)
    right = min(len(raw), left + max_len)

    # Align to word boundaries when possible.
    if left > 0:
        next_space = raw.find(" ", left)
        if next_space != -1 and next_space < right:
            left = next_space + 1
    if right < len(raw):
        prev_space = raw.rfind(" ", left, right)
        if prev_space != -1 and prev_space > left:
            right = prev_space

    snippet = raw[left:right].strip()
    if include_ellipsis and left > 0:
        snippet = "... " + snippet
    if include_ellipsis and right < len(raw):
        snippet = snippet + " ..."
    return snippet


def _split_text_segments(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    raw_segments = re.split(r"(?<=[\.\!\?;:])\s+|\s*[-*•]\s+|\s{2,}", cleaned)
    segments = [seg.strip(" -|") for seg in raw_segments if len(seg.strip()) >= 18]
    return segments


def _normalize_segment_prefix(segment: str) -> str:
    return re.sub(
        r"^(resumo|summary|technical skills|skills|projects|experiencia|experience)\s*[:\-]?\s*",
        "",
        segment,
        flags=re.IGNORECASE,
    ).strip()


def _sanitize_text_boundaries(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip(" -|,;:")
    if not cleaned:
        return ""
    tokens = cleaned.split()
    if not tokens:
        return ""
    last = tokens[-1]
    has_terminal_punct = cleaned[-1] in ".!?:;"
    if (
        not has_terminal_punct
        and len(last) >= 12
        and not re.search(r"[0-9]", last)
        and not re.search(r"[A-Z]{2,}", last)
    ):
        tokens = tokens[:-1]
        cleaned = " ".join(tokens).strip()
    return cleaned


def _truncate_text_naturally(text: str, max_chars: int = 260) -> str:
    cleaned = _sanitize_text_boundaries(text)
    if len(cleaned) <= max_chars:
        if cleaned and cleaned[-1] not in ".!?":
            return cleaned + "."
        return cleaned

    cut_window = cleaned[:max_chars]
    punct_pos = max(cut_window.rfind(". "), cut_window.rfind("; "), cut_window.rfind(": "))
    if punct_pos >= int(max_chars * 0.55):
        candidate = cut_window[: punct_pos + 1].strip()
    else:
        word_pos = cut_window.rfind(" ")
        candidate = cut_window[:word_pos].strip() if word_pos > 0 else cut_window.strip()
    candidate = _sanitize_text_boundaries(candidate)
    return candidate.rstrip(".") + "..."


def _segment_relevance_score(segment: str, skill: str) -> int:
    normalized = _normalize(segment)
    score = 0
    if _has_skill(normalized, skill):
        score += 5
    # Boost segments that look like real delivery context.
    for keyword in (
        "projeto",
        "api",
        "backend",
        "implement",
        "desenvolv",
        "rest",
        "sql",
        "arquitetura",
        "entity framework",
        "asp.net",
        "c#",
        ".net",
        "postgres",
    ):
        if keyword in normalized:
            score += 1
    # Slight penalty for heading-like text.
    if segment.isupper():
        score -= 2
    return score


def _build_relevant_evidence_summary(text: str, skill: str, max_chars: int = 260) -> str:
    segments = [
        _sanitize_text_boundaries(_normalize_segment_prefix(seg))
        for seg in _split_text_segments(text)
    ]
    segments = [seg for seg in segments if seg]
    if not segments:
        return _truncate_text_naturally(
            _excerpt_around_skill(text, skill, max_len=max_chars, include_ellipsis=False),
            max_chars=max_chars,
        )

    ranked = sorted(
        segments,
        key=lambda seg: (_segment_relevance_score(seg, skill), -len(seg)),
        reverse=True,
    )

    picked: list[str] = []
    seen: set[str] = set()
    for seg in ranked:
        norm = _normalize(seg)
        if norm in seen:
            continue
        if _segment_relevance_score(seg, skill) <= 0:
            continue
        candidate = " | ".join(picked + [seg]) if picked else seg
        if len(candidate) <= max_chars:
            picked.append(seg)
            seen.add(norm)
        if len(picked) >= 2:
            break

    if not picked:
        return _truncate_text_naturally(
            _excerpt_around_skill(text, skill, max_len=max_chars, include_ellipsis=False),
            max_chars=max_chars,
        )

    return _truncate_text_naturally(" | ".join(picked), max_chars=max_chars)


def _build_study_plan(prioritized_missing: list[tuple[str, float, str]]) -> list[StudyItem]:
    if not prioritized_missing:
        return [
            StudyItem(
                week=1,
                focus="Refino de portfolio e entrevistas",
                actions=[
                    "Criar 2 estudos de caso curtos com metricas.",
                    "Treinar respostas STAR para experiencias reais.",
                ],
                resources=["Pramp", "The STAR Method guide"],
            )
        ]

    ordered = list(OrderedDict.fromkeys([skill for skill, _, _ in prioritized_missing]))
    top1 = ordered[0]
    top2 = ordered[1] if len(ordered) > 1 else top1
    top3 = ordered[2] if len(ordered) > 2 else top2

    def _resources(skills: list[str]) -> list[str]:
        items: list[str] = []
        for skill in skills:
            items.extend(RESOURCES_BY_SKILL.get(skill, [f"Documentacao oficial de {skill}"]))
        return list(OrderedDict.fromkeys(items))[:4]

    return [
        StudyItem(
            week=1,
            focus=f"Fundamentos e lacuna critica: {top1}",
            actions=[
                f"Revisar fundamentos e principais conceitos de {top1}.",
                f"Resolver 2 exercicios praticos focados em {top1}.",
                "Registrar resumo tecnico com exemplos no GitHub.",
            ],
            resources=_resources([top1]),
        ),
        StudyItem(
            week=2,
            focus=f"Projeto guiado com foco em {top1} e {top2}",
            actions=[
                f"Construir mini API/projeto aplicando {top1} e {top2}.",
                "Adicionar readme com arquitetura e decisoes tecnicas.",
                "Publicar demo ou video curto de funcionamento.",
            ],
            resources=_resources([top1, top2]),
        ),
        StudyItem(
            week=3,
            focus=f"Qualidade, testes e integracao ({top2}, {top3})",
            actions=[
                f"Adicionar testes e validacoes nos fluxos que usam {top2}.",
                f"Integrar com componente real de backend envolvendo {top3}.",
                "Medir resultado (ex: cobertura, latencia, erros) e documentar.",
            ],
            resources=_resources([top2, top3]),
        ),
        StudyItem(
            week=4,
            focus="Prontidao para vaga: portfolio, curriculo e entrevistas",
            actions=[
                f"Atualizar curriculo com entregaveis concretos de {top1} e {top2}.",
                "Preparar 5 respostas de entrevista com metodo STAR.",
                "Aplicar para vagas-alvo e registrar feedbacks para iteracao.",
            ],
            resources=["GitHub", "LinkedIn Jobs", "STAR interview guide"],
        ),
    ]


def _resume_suggestions(target_role: str | None, missing_skills: list[str]) -> list[str]:
    role_label = target_role or "a vaga alvo"
    suggestions = [
        f"Reescrever resumo profissional focando resultados para {role_label}.",
        "Adicionar secoes de projetos com impacto numerico (latencia, custo, throughput).",
        "Listar stack tecnica por categoria (linguagens, cloud, dados, testes).",
    ]
    if missing_skills:
        suggestions.append(
            "Incluir plano de evolucao tecnica com foco em: " + ", ".join(missing_skills[:5]) + "."
        )
    return suggestions


def _optional_ollama_suggestion(
    target_role: str | None, matched: list[str], missing: list[str]
) -> str | None:
    if settings.llm_provider.lower() != "local":
        return None

    prompt = (
        "Voce e um analista de carreira. Gere 1 unica sugestao curta e objetiva "
        "para melhorar um curriculo tecnico em portugues. "
        f"Cargo alvo: {target_role or 'backend developer'}. "
        f"Skills fortes: {', '.join(matched[:8]) or 'nenhuma'}. "
        f"Gaps: {', '.join(missing[:8]) or 'nenhum'}."
    )
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
    }
    req = urllib.request.Request(
        url=f"{settings.ollama_base_url}/api/generate",
        method="POST",
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload).encode("utf-8"),
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            text = (data.get("response") or "").strip()
            return text if text else None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None


def _build_markdown_report(
    target_role: str | None,
    match_score: float,
    weighted_score: float,
    matched: list[str],
    missing: list[str],
    breakdown: list[SkillMatch],
    study_plan: list[StudyItem],
) -> str:
    role = target_role or "Backend Developer"
    lines = [
        f"# Relatorio de Aderencia - {role}",
        "",
        f"- Match score bruto: **{match_score}%**",
        f"- Match score ponderado: **{weighted_score}%**",
        f"- Skills com aderencia: **{len(matched)}**",
        f"- Gaps principais: **{len(missing)}**",
        "",
        "## Skills com aderencia",
    ]
    lines.extend([f"- {skill}" for skill in matched] or ["- Nenhuma identificada"])
    lines.append("")
    lines.append("## Gaps de competencias")
    lines.extend([f"- {skill}" for skill in missing] or ["- Nenhum gap relevante"])
    lines.append("")
    lines.append("## Evidencias (RAG)")
    evidence_items = [item for item in breakdown if item.present_in_resume and item.evidence]
    for item in evidence_items[:10]:
        meta_parts: list[str] = []
        if item.evidence_chunk:
            meta_parts.append(f"chunk {item.evidence_chunk}")
        if item.evidence_score is not None:
            meta_parts.append(f"score {item.evidence_score:.2f}")
        meta = f" ({' | '.join(meta_parts)})" if meta_parts else ""
        lines.append(f"- {item.skill}{meta}: {item.evidence}")
    if not evidence_items:
        lines.append("- Sem evidencia relevante recuperada.")
    lines.append("")
    lines.append("## Plano de estudo")
    for item in study_plan:
        lines.append(f"### Semana {item.week} - {item.focus}")
        lines.extend([f"- {action}" for action in item.actions])
    return "\n".join(lines)


def analyze_resume_vs_job(
    resume_text: str, job_description: str, target_role: str | None = None
) -> AnalyzeResponse:
    required = _extract_weighted_job_skills(job_description)

    breakdown = _build_skill_breakdown(required_skills=required, resume_text=resume_text)
    matched = [item.skill for item in breakdown if item.present_in_resume]
    missing = [item.skill for item in breakdown if not item.present_in_resume]
    prioritized_missing = sorted(
        [(item.skill, item.weight, item.source_section) for item in breakdown if not item.present_in_resume],
        key=lambda x: (-x[1], x[0]),
    )
    score = round((len(matched) / len(required)) * 100, 2) if required else 0.0

    total_weight = sum(item.weight for item in breakdown) or 1.0
    matched_weight = sum(item.weight for item in breakdown if item.present_in_resume)
    weighted_score = round((matched_weight / total_weight) * 100, 2)

    suggestions = _resume_suggestions(target_role, missing)
    model_tip = _optional_ollama_suggestion(target_role, matched, missing)
    if model_tip:
        suggestions.append(model_tip)

    study_plan = _build_study_plan(prioritized_missing=prioritized_missing)
    report_markdown = _build_markdown_report(
        target_role=target_role,
        match_score=score,
        weighted_score=weighted_score,
        matched=matched,
        missing=missing,
        breakdown=breakdown,
        study_plan=study_plan,
    )

    return AnalyzeResponse(
        match_score=score,
        weighted_match_score=weighted_score,
        matched_skills=matched,
        missing_skills=missing,
        skill_breakdown=breakdown,
        study_plan=study_plan,
        resume_optimization_suggestions=suggestions,
        report_markdown=report_markdown,
    )


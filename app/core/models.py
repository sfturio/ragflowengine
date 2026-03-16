from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    resume_text: str = Field(min_length=30, description="Texto do curriculo.")
    job_description: str = Field(min_length=30, description="Texto da vaga.")
    target_role: str | None = Field(
        default=None, description="Cargo alvo para orientar sugestoes."
    )


class SkillMatch(BaseModel):
    skill: str
    present_in_resume: bool
    weight: float = 1.0
    source_section: str = "geral"
    evidence: str | None = None


class StudyItem(BaseModel):
    week: int
    focus: str
    actions: list[str]
    resources: list[str]


class AnalyzeResponse(BaseModel):
    match_score: float
    weighted_match_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    skill_breakdown: list[SkillMatch]
    study_plan: list[StudyItem]
    resume_optimization_suggestions: list[str]
    report_markdown: str
    analysis_id: str | None = None
    created_at: str | None = None

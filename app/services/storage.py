from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import UTC, datetime
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

from app.core.models import AnalyzeResponse, SkillMatch, StudyItem
from app.core.settings import settings


def _is_postgres() -> bool:
    url = (settings.database_url or "").lower()
    return url.startswith("postgres://") or url.startswith("postgresql://")


def _get_sqlite_connection() -> sqlite3.Connection:
    db_path = Path(settings.sqlite_db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def _get_postgres_connection():
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL nao configurada.")
    return psycopg.connect(settings.database_url, row_factory=dict_row)


def init_db() -> None:
    ddl = """
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        target_role TEXT,
        match_score REAL NOT NULL,
        weighted_match_score REAL NOT NULL,
        matched_skills_json TEXT NOT NULL,
        missing_skills_json TEXT NOT NULL,
        skill_breakdown_json TEXT NOT NULL,
        study_plan_json TEXT NOT NULL,
        suggestions_json TEXT NOT NULL,
        report_markdown TEXT NOT NULL
    )
    """
    if _is_postgres():
        with _get_postgres_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
            conn.commit()
    else:
        with _get_sqlite_connection() as conn:
            conn.execute(ddl)


def save_analysis(result: AnalyzeResponse, target_role: str | None) -> str:
    analysis_id = str(uuid.uuid4())
    created_at = datetime.now(UTC).isoformat()

    values = (
        analysis_id,
        created_at,
        target_role,
        result.match_score,
        result.weighted_match_score,
        json.dumps(result.matched_skills, ensure_ascii=False),
        json.dumps(result.missing_skills, ensure_ascii=False),
        json.dumps([item.model_dump() for item in result.skill_breakdown], ensure_ascii=False),
        json.dumps([item.model_dump() for item in result.study_plan], ensure_ascii=False),
        json.dumps(result.resume_optimization_suggestions, ensure_ascii=False),
        result.report_markdown,
    )
    if _is_postgres():
        with _get_postgres_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO analyses (
                        id, created_at, target_role, match_score, weighted_match_score,
                        matched_skills_json, missing_skills_json, skill_breakdown_json,
                        study_plan_json, suggestions_json, report_markdown
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    values,
                )
            conn.commit()
    else:
        with _get_sqlite_connection() as conn:
            conn.execute(
                """
                INSERT INTO analyses (
                    id, created_at, target_role, match_score, weighted_match_score,
                    matched_skills_json, missing_skills_json, skill_breakdown_json,
                    study_plan_json, suggestions_json, report_markdown
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                values,
            )
    return analysis_id


def _row_to_response(row) -> AnalyzeResponse:
    return AnalyzeResponse(
        match_score=row["match_score"],
        weighted_match_score=row["weighted_match_score"],
        matched_skills=json.loads(row["matched_skills_json"]),
        missing_skills=json.loads(row["missing_skills_json"]),
        skill_breakdown=[SkillMatch(**item) for item in json.loads(row["skill_breakdown_json"])],
        study_plan=[StudyItem(**item) for item in json.loads(row["study_plan_json"])],
        resume_optimization_suggestions=json.loads(row["suggestions_json"]),
        report_markdown=row["report_markdown"],
        analysis_id=row["id"],
        created_at=row["created_at"],
    )


def get_analysis(analysis_id: str) -> AnalyzeResponse | None:
    if _is_postgres():
        with _get_postgres_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM analyses WHERE id = %s", (analysis_id,))
                row = cur.fetchone()
    else:
        with _get_sqlite_connection() as conn:
            row = conn.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,)).fetchone()
    if not row:
        return None
    return _row_to_response(row)


def list_analyses(limit: int = 20) -> list[dict]:
    if _is_postgres():
        with _get_postgres_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, created_at, target_role, match_score, weighted_match_score
                    FROM analyses
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cur.fetchall()
    else:
        with _get_sqlite_connection() as conn:
            rows = conn.execute(
                """
                SELECT id, created_at, target_role, match_score, weighted_match_score
                FROM analyses
                ORDER BY datetime(created_at) DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
    return [
        {
            "analysis_id": row["id"],
            "created_at": row["created_at"],
            "target_role": row["target_role"],
            "match_score": row["match_score"],
            "weighted_match_score": row["weighted_match_score"],
        }
        for row in rows
    ]

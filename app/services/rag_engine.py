from __future__ import annotations

import math
import re
from dataclasses import dataclass


@dataclass
class RagChunk:
    chunk_id: str
    text: str
    vector: list[float]


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> list[str]:
    if not text or not text.strip():
        return []

    # Prefer paragraph-aware chunking before falling back to sliding windows.
    normalized = text.replace("\r\n", "\n")
    parts = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n|\u2022", normalized)]
    parts = [p for p in parts if len(p) >= 30]
    if not parts:
        parts = [re.sub(r"\s+", " ", normalized).strip()]

    chunks: list[str] = []
    current = ""
    for part in parts:
        candidate = f"{current} {part}".strip()
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                chunks.append(current)
            if len(part) <= chunk_size:
                current = part
            else:
                # Fallback for oversized blocks with safer sentence/word boundaries.
                start = 0
                while start < len(part):
                    target_end = min(start + chunk_size, len(part))
                    if target_end == len(part):
                        chunks.append(part[start:target_end].strip())
                        break

                    window = part[start:target_end]
                    break_pos = max(
                        window.rfind(". "),
                        window.rfind("; "),
                        window.rfind(": "),
                        window.rfind(", "),
                        window.rfind(" "),
                    )
                    end = start + break_pos + 1 if break_pos >= max(20, len(window) // 2) else target_end
                    chunks.append(part[start:end].strip())
                    if end >= len(part):
                        break
                    next_start = max(end - overlap, start + 1)
                    if (
                        0 < next_start < len(part)
                        and part[next_start - 1].isalnum()
                        and part[next_start].isalnum()
                    ):
                        next_space = part.find(" ", next_start)
                        if next_space != -1:
                            next_start = next_space + 1
                    start = next_start
                current = ""
    if current:
        chunks.append(current)
    return chunks


def embed_text(text: str, dims: int = 384) -> list[float]:
    tokens = re.findall(r"[a-zA-Z0-9\.\+#]+", text.lower())
    vec = [0.0] * dims
    if not tokens:
        return vec
    for token in tokens:
        idx = hash(token) % dims
        vec[idx] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def build_index(text: str) -> list[RagChunk]:
    chunks = chunk_text(text)
    return [
        RagChunk(chunk_id=f"c{i+1}", text=chunk, vector=embed_text(chunk))
        for i, chunk in enumerate(chunks)
    ]


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    return sum(a * b for a, b in zip(vec_a, vec_b))


def search(index: list[RagChunk], query: str, top_k: int = 3) -> list[tuple[RagChunk, float]]:
    if not index:
        return []
    qvec = embed_text(query)
    scored = [(chunk, cosine_similarity(qvec, chunk.vector)) for chunk in index]
    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[:top_k]

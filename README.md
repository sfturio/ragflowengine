# rag-careerfit-engine

MVP para analisar aderencia entre curriculo e vaga e gerar:
- match score (%),
- match score ponderado por secao da vaga,
- gaps de competencias,
- plano de estudo de 4 semanas,
- sugestoes para otimizar o curriculo,
- relatorio exportavel em Markdown/PDF,
- evidencias por RAG vetorial local.

## Melhorias recentes
- Frontend refatorado para fluxo guiado (upload -> vaga -> analise -> resultado -> plano).
- Evidencias RAG mais legiveis:
  - resumo de evidencia por skill com texto mais limpo,
  - sem quebra de palavra no meio ao truncar,
  - metadados estruturados por item (`evidence_chunk`, `evidence_score`),
  - renderizacao em cards com skill, chunk/score e corpo separado.
- Chunking RAG com boundaries mais seguras para reduzir cortes artificiais.

## Requisitos
- Python 3.12+
- Opcional para IA local: Ollama

## Como rodar
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
uvicorn app.main:app --reload
```

API: `http://127.0.0.1:8000`
Docs: `http://127.0.0.1:8000/docs`
Frontend web: `http://127.0.0.1:8000`

Frontend Streamlit legado (opcional):
```bash
python -m streamlit run frontend_streamlit.py
```

## Rodar com Docker
```bash
docker compose up --build
```
API: `http://127.0.0.1:8000`
Frontend: `http://127.0.0.1:8501`

## Deploy no Render com Supabase
1. Crie um projeto no Supabase e copie a `Connection string` PostgreSQL.
2. Garanta que a URL tenha SSL:
   - `?sslmode=require`
3. No Render, crie o Web Service pelo Blueprint `render.yaml`.
4. Defina o secret `DATABASE_URL` com a string do Supabase.
5. O app sobe em:
   - `startCommand`: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Endpoint principal
`POST /api/v1/analyze`

Exemplo de payload:
```json
{
  "resume_text": "Python, FastAPI, Docker, PostgreSQL, GitHub Actions",
  "job_description": "Vaga para backend com Python, FastAPI, AWS, CI/CD e testes.",
  "target_role": "Backend Engineer"
}
```

Resposta inclui:
- `match_score`: score bruto por quantidade de skills.
- `weighted_match_score`: score com pesos (`Requisitos` > `Atribuicoes` > `Diferenciais`).
- `skill_breakdown`: lista detalhada por skill, incluindo:
  - `evidence` (texto resumido/legivel),
  - `evidence_chunk` (id do chunk de origem),
  - `evidence_score` (score semantico do trecho).
- `report_markdown`: relatorio pronto para download.
- `analysis_id` e `created_at`: identificacao da analise salva.

Endpoint para PDF:
- `POST /api/v1/analyze/pdf` (multipart)
- Campos: `resume_pdf` (arquivo `.pdf`), `job_description` (texto), `target_role` (opcional)

Endpoints de historico:
- `GET /api/v1/analyses?limit=20`
- `GET /api/v1/analyses/{analysis_id}`
- `GET /api/v1/analyses/{analysis_id}/report.pdf`

## IA local gratuita (opcional)
1. Instale o Ollama: https://ollama.com/
2. Baixe um modelo:
```bash
ollama pull llama3.1:8b
```
No Windows PowerShell (via winget):
```powershell
winget install --id Ollama.Ollama -e
```
3. Variaveis de ambiente opcionais:
```bash
set LLM_PROVIDER=local
set OLLAMA_BASE_URL=http://localhost:11434
set OLLAMA_MODEL=llama3.1:8b
```

Sem Ollama rodando, a API continua funcionando com regras deterministicas.

## O que e banco vetorial
Banco vetorial armazena embeddings (vetores numericos) de textos.
Isso permite busca semantica por similaridade, em vez de busca por palavra exata.
No projeto, ele conecta trechos do curriculo e trilhas de estudo ao contexto da vaga (base do RAG).

Neste projeto, o RAG vetorial local funciona assim:
- chunking do curriculo em trechos curtos,
- embedding local leve (hashing) por chunk,
- busca por similaridade para gerar evidencias no `skill_breakdown` e no relatorio.

## Persistencia local
- Banco SQLite local em `data/careerfit.db`.
- Variavel opcional: `SQLITE_DB_PATH`.

## Banco em producao
- Se `DATABASE_URL` estiver setada para `postgresql://...`, o app usa Postgres (Supabase).
- Sem `DATABASE_URL`, usa SQLite local automaticamente.

## Testes
```bash
pytest -q
```

## Proximos passos
- Evoluir embedding local para modelo semantico real (opcionalmente com vetor DB externo).
- Melhorar ranqueamento de evidencias por contexto de experiencia/projeto.
- Adicionar filtros no historico (cargo, data, score).
- Criar suite de testes E2E para o frontend.

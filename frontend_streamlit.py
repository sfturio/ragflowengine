import requests
import streamlit as st


API_BASE_URL = "http://127.0.0.1:8000"


def _fetch_history(api_url: str) -> list[dict]:
    try:
        response = requests.get(f"{api_url}/api/v1/analyses?limit=20", timeout=10)
        if response.ok:
            return response.json()
    except requests.RequestException:
        return []
    return []


def _fetch_analysis(api_url: str, analysis_id: str) -> dict | None:
    try:
        response = requests.get(f"{api_url}/api/v1/analyses/{analysis_id}", timeout=20)
        if response.ok:
            return response.json()
    except requests.RequestException:
        return None
    return None


def _render_result(data: dict) -> None:
    st.subheader("Resultado da analise")
    metric_col1, metric_col2 = st.columns(2)
    with metric_col1:
        st.metric("Match Score", f"{data.get('match_score', 0)}%")
    with metric_col2:
        st.metric("Score Ponderado", f"{data.get('weighted_match_score', 0)}%")

    col1, col2 = st.columns(2)
    with col1:
        st.write("Skills em aderencia")
        for skill in data.get("matched_skills", []):
            st.success(skill)
    with col2:
        st.write("Lacunas")
        for skill in data.get("missing_skills", []):
            st.warning(skill)

    st.write("Plano de estudo (4 semanas)")
    for item in data.get("study_plan", []):
        st.markdown(f"**Semana {item['week']} - {item['focus']}**")
        st.write("Acoes:")
        for action in item.get("actions", []):
            st.markdown(f"- {action}")
        st.write("Recursos:")
        for resource in item.get("resources", []):
            st.markdown(f"- {resource}")

    st.write("Sugestoes para otimizar curriculo")
    for suggestion in data.get("resume_optimization_suggestions", []):
        st.markdown(f"- {suggestion}")

    report_md = data.get("report_markdown")
    if report_md:
        analysis_id = data.get("analysis_id")
        st.download_button(
            "Baixar relatorio (Markdown)",
            data=report_md,
            file_name="relatorio_aderencia.md",
            mime="text/markdown",
        )
        if analysis_id:
            st.link_button(
                "Baixar relatorio (PDF)",
                url=f"{api_url}/api/v1/analyses/{analysis_id}/report.pdf",
            )


st.set_page_config(page_title="CareerFit RAG Engine", page_icon=":briefcase:", layout="wide")
st.title("CareerFit RAG Engine")
st.caption("Analise de aderencia entre curriculo e vaga com plano de estudo.")

with st.sidebar:
    st.header("Configuracao")
    api_url = st.text_input("API URL", value=API_BASE_URL)
    target_role = st.text_input("Cargo alvo (opcional)", value="Backend Developer")
    st.markdown("---")
    st.subheader("Historico")
    history = _fetch_history(api_url)
    if history:
        history_options = {
            f"{item['created_at'][:19]} | {item.get('target_role') or 'Sem cargo'} | {item['weighted_match_score']:.1f}%": item[
                "analysis_id"
            ]
            for item in history
        }
        selected_key = st.selectbox("Analises salvas", options=list(history_options.keys()))
        if st.button("Abrir analise selecionada"):
            loaded = _fetch_analysis(api_url, history_options[selected_key])
            if loaded:
                st.session_state["loaded_analysis"] = loaded
            else:
                st.error("Nao foi possivel carregar a analise.")
    else:
        st.caption("Nenhuma analise salva ainda.")

tab_pdf, tab_text = st.tabs(["Curriculo em PDF", "Curriculo em texto"])

with tab_pdf:
    st.write("Envie seu curriculo em PDF e cole o texto da vaga.")
    uploaded_pdf = st.file_uploader("Curriculo PDF", type=["pdf"], key="pdf_upload")
    job_description_pdf = st.text_area("Descricao da vaga", height=220, key="job_pdf")

    if st.button("Analisar PDF", type="primary"):
        if not uploaded_pdf or not job_description_pdf.strip():
            st.error("Envie o PDF e preencha a descricao da vaga.")
        else:
            with st.spinner("Analisando..."):
                files = {"resume_pdf": (uploaded_pdf.name, uploaded_pdf.getvalue(), "application/pdf")}
                data = {
                    "job_description": job_description_pdf,
                    "target_role": target_role,
                }
                try:
                    response = requests.post(
                        f"{api_url}/api/v1/analyze/pdf", files=files, data=data, timeout=60
                    )
                    if response.ok:
                        result = response.json()
                        st.session_state["loaded_analysis"] = result
                    else:
                        st.error(f"Erro {response.status_code}: {response.text}")
                except requests.RequestException as exc:
                    st.error(f"Falha ao conectar na API: {exc}")

with tab_text:
    st.write("Cole o curriculo e a vaga em texto.")
    resume_text = st.text_area("Texto do curriculo", height=220, key="resume_text")
    job_description_text = st.text_area("Descricao da vaga", height=220, key="job_text")

    if st.button("Analisar texto"):
        if not resume_text.strip() or not job_description_text.strip():
            st.error("Preencha os dois campos de texto.")
        else:
            with st.spinner("Analisando..."):
                payload = {
                    "resume_text": resume_text,
                    "job_description": job_description_text,
                    "target_role": target_role,
                }
                try:
                    response = requests.post(f"{api_url}/api/v1/analyze", json=payload, timeout=60)
                    if response.ok:
                        result = response.json()
                        st.session_state["loaded_analysis"] = result
                    else:
                        st.error(f"Erro {response.status_code}: {response.text}")
                except requests.RequestException as exc:
                    st.error(f"Falha ao conectar na API: {exc}")

loaded_analysis = st.session_state.get("loaded_analysis")
if loaded_analysis:
    st.markdown("---")
    st.subheader("Analise carregada")
    _render_result(loaded_analysis)

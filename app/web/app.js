const apiBase = window.location.origin;

const elements = {
  refreshHistoryBtn: document.getElementById("refresh-history-btn"),
  analyzeBtn: document.getElementById("analyze-btn"),
  resumePdf: document.getElementById("resume-pdf"),
  resumeText: document.getElementById("resume-text"),
  targetRole: document.getElementById("target-role"),
  jobDescription: document.getElementById("job-description"),
  statusText: document.getElementById("status-text"),
  historyList: document.getElementById("history-list"),
  resultsPanel: document.getElementById("results-panel"),
  metricMatch: document.getElementById("metric-match"),
  metricWeighted: document.getElementById("metric-weighted"),
  matchedList: document.getElementById("matched-list"),
  missingList: document.getElementById("missing-list"),
  studyPlan: document.getElementById("study-plan"),
  suggestionsList: document.getElementById("suggestions-list"),
  evidenceList: document.getElementById("evidence-list"),
  downloadMdBtn: document.getElementById("download-md-btn"),
  downloadPdfLink: document.getElementById("download-pdf-link"),
};

let currentAnalysis = null;

async function fetchHistory() {
  try {
    const response = await fetch(`${apiBase}/api/v1/analyses?limit=20`);
    if (!response.ok) return;
    const data = await response.json();
    renderHistory(data);
  } catch (error) {
    elements.historyList.innerHTML = `<div class="muted">Falha ao carregar historico.</div>`;
  }
}

function renderHistory(items) {
  if (!items.length) {
    elements.historyList.innerHTML = `<div class="muted">Nenhuma analise salva ainda.</div>`;
    return;
  }
  elements.historyList.innerHTML = "";
  for (const item of items) {
    const div = document.createElement("button");
    div.className = "history-item";
    div.innerHTML = `
      <strong>${item.target_role || "Sem cargo alvo"}</strong><br>
      <small>${(item.created_at || "").replace("T", " ").slice(0, 19)}</small><br>
      <small>Score: ${item.weighted_match_score.toFixed(2)}%</small>
    `;
    div.addEventListener("click", () => loadAnalysis(item.analysis_id));
    elements.historyList.appendChild(div);
  }
}

async function loadAnalysis(analysisId) {
  setStatus("Carregando analise...");
  try {
    const response = await fetch(`${apiBase}/api/v1/analyses/${analysisId}`);
    if (!response.ok) throw new Error();
    const data = await response.json();
    renderResults(data);
    setStatus("Analise carregada.");
  } catch {
    setStatus("Nao foi possivel carregar essa analise.");
  }
}

function setStatus(text) {
  elements.statusText.textContent = text;
}

async function analyze() {
  const jobDescription = elements.jobDescription.value.trim();
  if (!jobDescription) {
    setStatus("Cole a descricao da vaga.");
    return;
  }

  const targetRole = elements.targetRole.value.trim();
  const resumeFile = elements.resumePdf.files[0];
  const resumeText = elements.resumeText.value.trim();
  if (!resumeFile && !resumeText) {
    setStatus("Envie PDF ou cole o curriculo.");
    return;
  }

  setStatus("Analisando...");
  elements.analyzeBtn.disabled = true;

  try {
    let response;
    if (resumeFile) {
      const formData = new FormData();
      formData.append("resume_pdf", resumeFile);
      formData.append("job_description", jobDescription);
      if (targetRole) formData.append("target_role", targetRole);
      response = await fetch(`${apiBase}/api/v1/analyze/pdf`, {
        method: "POST",
        body: formData,
      });
    } else {
      response = await fetch(`${apiBase}/api/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
          target_role: targetRole || null,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || "Erro ao analisar");
    }

    const result = await response.json();
    renderResults(result);
    setStatus("Analise concluida.");
    fetchHistory();
  } catch (error) {
    setStatus(`Erro: ${error.message}`);
  } finally {
    elements.analyzeBtn.disabled = false;
  }
}

function renderResults(data) {
  currentAnalysis = data;
  elements.resultsPanel.classList.remove("hidden");
  elements.metricMatch.textContent = `${(data.match_score || 0).toFixed(2)}%`;
  elements.metricWeighted.textContent = `${(data.weighted_match_score || 0).toFixed(2)}%`;

  elements.matchedList.innerHTML = (data.matched_skills || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");
  elements.missingList.innerHTML = (data.missing_skills || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  elements.studyPlan.innerHTML = (data.study_plan || [])
    .map(
      (w) => `
        <div class="week">
          <strong>Semana ${w.week} - ${escapeHtml(w.focus)}</strong>
          <ul>${(w.actions || []).map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
        </div>
      `
    )
    .join("");

  elements.suggestionsList.innerHTML = (data.resume_optimization_suggestions || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  const evidenceItems = (data.skill_breakdown || [])
    .filter((item) => item.present_in_resume && item.evidence)
    .slice(0, 8);
  elements.evidenceList.innerHTML = evidenceItems
    .map((item) => `<li><strong>${escapeHtml(item.skill)}:</strong> ${escapeHtml(item.evidence)}</li>`)
    .join("");

  elements.downloadPdfLink.href = data.analysis_id
    ? `${apiBase}/api/v1/analyses/${data.analysis_id}/report.pdf`
    : "#";
}

function downloadMarkdown() {
  if (!currentAnalysis || !currentAnalysis.report_markdown) return;
  const blob = new Blob([currentAnalysis.report_markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `relatorio-${currentAnalysis.analysis_id || "careerfit"}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

elements.analyzeBtn.addEventListener("click", analyze);
elements.refreshHistoryBtn.addEventListener("click", fetchHistory);
elements.downloadMdBtn.addEventListener("click", downloadMarkdown);

fetchHistory();

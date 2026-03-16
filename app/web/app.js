const apiBase = window.location.origin;

const elements = {
  refreshHistoryBtn: document.getElementById("refresh-history-btn"),
  continueStep2Btn: document.getElementById("continue-step2-btn"),
  backStep1Btn: document.getElementById("back-step1-btn"),
  toStep5Btn: document.getElementById("to-step5-btn"),
  analyzeBtn: document.getElementById("analyze-btn"),
  resumePdf: document.getElementById("resume-pdf"),
  resumeDropzone: document.getElementById("resume-dropzone"),
  resumeFileName: document.getElementById("resume-file-name"),
  resumeText: document.getElementById("resume-text"),
  targetRole: document.getElementById("target-role"),
  jobDescription: document.getElementById("job-description"),
  statusText: document.getElementById("status-text"),
  historyList: document.getElementById("history-list"),
  resultsPanel: document.getElementById("results-panel"),
  metricMatch: document.getElementById("metric-match"),
  metricWeighted: document.getElementById("metric-weighted"),
  metricCompetitiveness: document.getElementById("metric-competitiveness"),
  nextStepText: document.getElementById("next-step-text"),
  matchedList: document.getElementById("matched-list"),
  missingList: document.getElementById("missing-list"),
  studyPlan: document.getElementById("study-plan"),
  suggestionsList: document.getElementById("suggestions-list"),
  evidenceList: document.getElementById("evidence-list"),
  downloadMdBtn: document.getElementById("download-md-btn"),
  downloadPdfLink: document.getElementById("download-pdf-link"),
  screens: {
    upload: document.getElementById("screen-upload"),
    target: document.getElementById("screen-target"),
    loading: document.getElementById("screen-loading"),
    dashboard: document.getElementById("results-panel"),
    actionPlan: document.getElementById("screen-actionplan"),
  },
  stepNodes: Array.from(document.querySelectorAll("[data-step-node]")),
  stepProgressFill: document.getElementById("step-progress-fill"),
  scoreRingProgress: document.getElementById("score-ring-progress"),
};

let currentAnalysis = null;

function setStatus(text) {
  elements.statusText.textContent = text || "";
}

function setScreen(screenKey) {
  Object.values(elements.screens).forEach((screen) => {
    if (!screen) return;
    screen.classList.remove("active");
  });
  const next = elements.screens[screenKey];
  if (next) next.classList.add("active");
}

function getFlowStep() {
  if (elements.screens.dashboard.classList.contains("active") || elements.screens.actionPlan.classList.contains("active")) {
    return 4;
  }
  const hasResume = Boolean(elements.resumePdf.files[0]) || elements.resumeText.value.trim().length > 0;
  const hasJob = elements.jobDescription.value.trim().length > 0;
  if (!hasResume) return 1;
  if (!hasJob) return 2;
  return 3;
}

function setStep(step) {
  const fillByStep = { 1: "0%", 2: "33%", 3: "66%", 4: "100%" };
  if (elements.stepProgressFill) {
    elements.stepProgressFill.style.width = fillByStep[step] || "0%";
  }

  elements.stepNodes.forEach((node) => {
    const nodeStep = Number(node.dataset.stepNode || 0);
    node.classList.remove("is-current", "is-complete", "is-upcoming");
    if (nodeStep < step) {
      node.classList.add("is-complete");
    } else if (nodeStep === step) {
      node.classList.add("is-current");
    } else {
      node.classList.add("is-upcoming");
    }

    const dot = node.querySelector(".step-dot");
    if (dot) {
      dot.textContent = nodeStep < step ? "v" : String(nodeStep);
    }
  });
}

function refreshStepByInputs() {
  setStep(getFlowStep());
  const hasResume = Boolean(elements.resumePdf.files[0]) || elements.resumeText.value.trim().length > 0;
  if (elements.continueStep2Btn) {
    elements.continueStep2Btn.disabled = !hasResume;
  }
}

function updateScoreRing(score) {
  if (!elements.scoreRingProgress) return;
  const circumference = 314;
  const safeScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (safeScore / 100) * circumference;
  elements.scoreRingProgress.style.strokeDashoffset = String(offset);
}

async function fetchHistory() {
  try {
    const response = await fetch(`${apiBase}/api/v1/analyses?limit=20`);
    if (!response.ok) return;
    const data = await response.json();
    renderHistory(data);
  } catch {
    elements.historyList.innerHTML = `<div class="empty-state">Falha ao carregar historico.</div>`;
  }
}

function renderHistory(items) {
  if (!items.length) {
    elements.historyList.innerHTML = `<div class="empty-state">Voce ainda nao analisou nenhuma vaga.</div>`;
    return;
  }

  elements.historyList.innerHTML = "";
  for (const item of items) {
    const button = document.createElement("button");
    button.className = "history-item";
    button.innerHTML = `
      <div class="history-head">
        <span class="history-role">${escapeHtml(item.target_role || "Sem cargo alvo")}</span>
        <span class="history-score">${(item.weighted_match_score || 0).toFixed(1)}%</span>
      </div>
      <div class="history-date">${(item.created_at || "").replace("T", " ").slice(0, 19)}</div>
    `;
    button.addEventListener("click", () => loadAnalysis(item.analysis_id));
    elements.historyList.appendChild(button);
  }
}

async function loadAnalysis(analysisId) {
  setStatus("Carregando analise...");
  try {
    const response = await fetch(`${apiBase}/api/v1/analyses/${analysisId}`);
    if (!response.ok) throw new Error("falha");
    const data = await response.json();
    renderResults(data);
    setScreen("actionPlan");
    setStep(4);
    setStatus("Analise carregada.");
  } catch {
    setStatus("Nao foi possivel carregar essa analise.");
  }
}

async function analyze() {
  const jobDescription = elements.jobDescription.value.trim();
  if (!jobDescription) {
    setStatus("Cole a descricao da vaga.");
    setScreen("target");
    setStep(2);
    return;
  }

  const targetRole = elements.targetRole.value.trim();
  const resumeFile = elements.resumePdf.files[0];
  const resumeText = elements.resumeText.value.trim();
  if (!resumeFile && !resumeText) {
    setStatus("Envie PDF ou cole o curriculo.");
    setScreen("upload");
    setStep(1);
    return;
  }

  setStatus("Analisando...");
  elements.analyzeBtn.disabled = true;
  setScreen("loading");
  setStep(3);

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
    setScreen("dashboard");
    setStep(4);
    setStatus("Analise concluida.");
    fetchHistory();
  } catch (error) {
    setStatus(`Erro: ${error.message}`);
    setScreen("target");
    refreshStepByInputs();
  } finally {
    elements.analyzeBtn.disabled = false;
  }
}

function renderResults(data) {
  currentAnalysis = data;

  const rawScore = data.match_score || 0;
  const weightedScore = data.weighted_match_score || 0;
  elements.metricMatch.textContent = `${rawScore.toFixed(2)}%`;
  elements.metricWeighted.textContent = `${weightedScore.toFixed(2)}%`;
  elements.metricCompetitiveness.textContent = competitivenessLabel(weightedScore);
  updateScoreRing(rawScore);

  elements.nextStepText.textContent = buildNextStepText(data);

  elements.matchedList.innerHTML = (data.matched_skills || [])
    .map((skill) => `<li>${escapeHtml(skill)}</li>`)
    .join("");
  if (!elements.matchedList.innerHTML) {
    elements.matchedList.innerHTML = "<li>Nenhuma skill identificada</li>";
  }

  elements.missingList.innerHTML = (data.missing_skills || [])
    .map(
      (skill) => `
        <li>
          <div class="bar-head">
            <span>${escapeHtml(skill)}</span>
            <span>Prioridade</span>
          </div>
          <div class="bar-track"><div class="bar-fill"></div></div>
        </li>
      `
    )
    .join("");
  if (!elements.missingList.innerHTML) {
    elements.missingList.innerHTML = "<li><div class='bar-head'><span>Sem gaps relevantes</span></div></li>";
  }

  elements.studyPlan.innerHTML = (data.study_plan || [])
    .map(
      (week) => `
        <div class="week">
          <strong>Semana ${week.week} - ${escapeHtml(week.focus)}</strong>
          <ul>${(week.actions || []).map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>
        </div>
      `
    )
    .join("");

  elements.suggestionsList.innerHTML = (data.resume_optimization_suggestions || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  if (!elements.suggestionsList.innerHTML) {
    elements.suggestionsList.innerHTML = "<li>Nenhuma sugestao disponivel.</li>";
  }

  const evidenceItems = (data.skill_breakdown || [])
    .filter((item) => item.present_in_resume && item.evidence)
    .slice(0, 8);
  elements.evidenceList.innerHTML = evidenceItems
    .map((item) => `<li><strong>${escapeHtml(item.skill)}:</strong> ${escapeHtml(item.evidence)}</li>`)
    .join("");
  if (!elements.evidenceList.innerHTML) {
    elements.evidenceList.innerHTML = "<li>Sem evidencias relevantes nesta analise.</li>";
  }

  elements.downloadPdfLink.href = data.analysis_id
    ? `${apiBase}/api/v1/analyses/${data.analysis_id}/report.pdf`
    : "#";
}

function competitivenessLabel(weightedScore) {
  if (weightedScore >= 80) return "Alta";
  if (weightedScore >= 55) return "Media";
  return "Baixa";
}

function buildNextStepText(data) {
  const firstWeek = (data.study_plan || [])[0];
  if (firstWeek && firstWeek.focus) {
    return `Foque na Semana ${firstWeek.week}: ${firstWeek.focus}.`;
  }
  const firstMissing = (data.missing_skills || [])[0];
  if (firstMissing) {
    return `Priorize evolucao em ${firstMissing} para aumentar seu match.`;
  }
  return "Refine portfolio e curriculo com projetos orientados a impacto.";
}

function bindUploadUX() {
  if (!elements.resumeDropzone || !elements.resumePdf) return;

  const setFileName = () => {
    const file = elements.resumePdf.files && elements.resumePdf.files[0];
    elements.resumeFileName.textContent = file ? file.name : "Nenhum arquivo selecionado";
    refreshStepByInputs();
  };

  elements.resumePdf.addEventListener("change", setFileName);
  ["dragenter", "dragover"].forEach((eventName) => {
    elements.resumeDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.resumeDropzone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.resumeDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.resumeDropzone.classList.remove("drag-over");
    });
  });

  elements.resumeDropzone.addEventListener("drop", (event) => {
    const files = event.dataTransfer && event.dataTransfer.files;
    if (!files || !files.length) return;
    elements.resumePdf.files = files;
    setFileName();
  });
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

function bindNavigation() {
  elements.continueStep2Btn.addEventListener("click", () => {
    setScreen("target");
    setStep(2);
  });

  elements.backStep1Btn.addEventListener("click", () => {
    setScreen("upload");
    refreshStepByInputs();
  });

  elements.toStep5Btn.addEventListener("click", () => {
    setScreen("actionPlan");
    setStep(4);
  });

  elements.refreshHistoryBtn.addEventListener("click", () => {
    fetchHistory();
    setScreen("actionPlan");
    if (currentAnalysis) {
      setStep(4);
    } else {
      refreshStepByInputs();
    }
  });

  elements.resumeText.addEventListener("input", refreshStepByInputs);
  elements.jobDescription.addEventListener("input", refreshStepByInputs);
}

elements.analyzeBtn.addEventListener("click", analyze);
elements.downloadMdBtn.addEventListener("click", downloadMarkdown);

bindNavigation();
bindUploadUX();
refreshStepByInputs();
fetchHistory();

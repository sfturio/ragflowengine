(function () {
  const app = document.getElementById('app');

  const state = {
    page: 'match',
    loading: false,
    error: '',
    result: null,
    history: [],
    helpOpen: false,
    feedbackOpen: false,
    feedbackText: ''
  };

  const UI_TEXT = {
    navOther: 'Confira nosso outro app:',
    navOtherLink: 'ATSFlow Engine',
    navMatch: 'Analise de Match',
    navResult: 'Resultado de Carreira',
    navHistory: 'Historico',
    newAnalysis: 'Nova Analise',
    heroBadge: 'RAGFlow Analise de Match',
    heroTitle: 'Entenda como seu curriculo combina com vagas reais',
    heroSub: 'Analise semantica com transparencia deterministica e orientacoes praticas.',
    uploadTitle: 'Contexto do Curriculo',
    uploadBody: 'Clique para enviar ou arraste PDF (ate 8MB)',
    uploadNoFile: 'Nenhum arquivo selecionado ainda.',
    uploadSelectedPrefix: 'PDF selecionado:',
    resumeLabel: 'Texto do Curriculo',
    resumePlaceholder: 'Se preferir, cole o texto do curriculo aqui. Se voce ja enviou PDF, pode deixar em branco.',
    jobLabel: 'Descricao da Vaga',
    jobPlaceholder: 'Cole aqui a descricao da vaga alvo...',
    strategy: 'Parametros de Estrategia',
    targetRole: 'Cargo Alvo',
    targetRolePlaceholder: 'ex.: Engenheiro de Software Senior',
    step1: 'Curriculo carregado',
    step2: 'Contexto da vaga mapeado',
    step3: 'Analise semantica',
    run: 'Rodar Analise de Carreira',
    running: 'Analisando...',
    previewTitle: 'Previa da Analise',
    previewText: 'Match de skills, gaps, evidencias e plano de estudo em um fluxo unico.',
    noResult: 'Sem resultado ainda',
    noResultSub: 'Rode uma analise na tela de Match primeiro.',
    backToMatch: 'Ir para Analise de Match',
    resultBadge: 'Resultado de Carreira',
    resultTitle: 'Avaliacao de Match',
    weightedScore: 'Match Ponderado',
    insight: 'Insight de IA',
    download: 'Baixar Relatorio',
    skillsViz: 'Visualizacao de Match de Skills',
    gaps: 'Skills em Gap',
    noGaps: 'Nenhum gap relevante encontrado.',
    timeline: 'Plano de Estudo',
    strategic: 'Melhorias Estrategicas',
    historyTitle: 'Historico',
    historySub: 'Linha do tempo das analises anteriores.',
    open: 'Abrir',
    emptyHistory: 'Nenhuma analise ainda.',
    model: 'Modelo',
    provider: 'Provedor',
    errorLoad: 'Nao foi possivel carregar os dados. Tente novamente.'
  };

  const t = (key) => UI_TEXT[key] || key;

  function SidebarSupportSection() {
    return `
      <div class="space-y-1.5">
        <button id="open-help" class="w-full text-left px-2 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm font-medium flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">help</span><span>Ajuda</span>
        </button>
        <button id="open-feedback" class="w-full text-left px-2 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm font-medium flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">chat</span><span>Feedback</span>
        </button>
      </div>
    `;
  }

  function HelpModal() {
    return `
      <div class="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" data-close-modal="help">
        <div class="w-full max-w-3xl max-h-[86vh] overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-2xl p-8 md:p-10">
          <div class="flex items-start justify-between gap-4 mb-8">
            <h2 class="text-3xl font-bold tracking-tight">Como usar este app</h2>
            <button id="close-help" class="px-3 py-1.5 rounded-lg text-sm font-semibold bg-surface-container-low hover:bg-surface-container-high">Fechar</button>
          </div>

          <ol class="space-y-3 text-[15px] leading-relaxed list-decimal pl-5 mb-10">
            <li>Envie seu curriculo em PDF ou cole o texto.</li>
            <li>Adicione a descricao da vaga que voce quer atingir.</li>
            <li>Opcionalmente, defina seu cargo alvo.</li>
            <li>Rode a analise.</li>
            <li>Revise os scores, insights e sugestoes de melhoria.</li>
            <li>Baixe ou revise sua analise depois no Historico.</li>
          </ol>

          <section class="mb-10">
            <h3 class="text-xl font-bold mb-4">Perguntas Frequentes</h3>
            <div class="space-y-4 text-[15px] leading-relaxed">
              <div><p class="font-semibold">Esta analise e 100% precisa?</p><p class="text-on-surface-variant">Nao. Esta ferramenta combina analise deterministica e assistencia de IA para orientar, sem garantias absolutas.</p></div>
              <div><p class="font-semibold">Voce armazena meu curriculo?</p><p class="text-on-surface-variant">As analises podem ser armazenadas localmente para melhorar sua experiencia e manter historico.</p></div>
              <div><p class="font-semibold">Posso usar isso em candidaturas reais?</p><p class="text-on-surface-variant">Sim. A ferramenta ajuda a otimizar estrutura e posicionamento, mas ajustes finais sempre sao recomendados.</p></div>
              <div><p class="font-semibold">Por que os scores diferem de outras ferramentas?</p><p class="text-on-surface-variant">Cada plataforma usa heuristicas e modelos diferentes. Este app prioriza clareza, transparencia e insights acionaveis.</p></div>
              <div><p class="font-semibold">Qual a diferenca entre ATSFlow e RAGFlow?</p><p class="text-on-surface-variant">ATSFlow foca em otimizacao tecnica para ATS. RAGFlow foca em match semantico e estrategia de carreira.</p></div>
            </div>
          </section>

          <section>
            <h3 class="text-xl font-bold mb-4">Dicas para melhores resultados</h3>
            <ul class="space-y-2 text-[15px] leading-relaxed list-disc pl-5 text-on-surface-variant">
              <li>Use descricoes de vaga completas.</li>
              <li>Evite curriculos extremamente curtos.</li>
              <li>Foque em conquistas mensuraveis.</li>
              <li>Mantenha a formatacao simples e amigavel para ATS.</li>
            </ul>
          </section>
        </div>
      </div>
    `;
  }

  function FeedbackModal() {
    return `
      <div class="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" data-close-modal="feedback">
        <div class="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl p-8">
          <div class="flex items-start justify-between gap-4 mb-6">
            <h2 class="text-2xl font-bold tracking-tight">Feedback</h2>
            <button id="close-feedback" class="px-3 py-1.5 rounded-lg text-sm font-semibold bg-surface-container-low hover:bg-surface-container-high">Fechar</button>
          </div>
          <label for="feedback-input" class="block text-sm font-semibold mb-3">Compartilhe sua sugestao ou reporte um problema</label>
          <textarea id="feedback-input" class="w-full h-44 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:border-primary/40 focus:ring-2 focus:ring-primary/15 resize-none" placeholder="Digite seu feedback aqui...">${state.feedbackText || ''}</textarea>
          <div class="mt-5 flex justify-end">
            <button id="send-feedback" class="px-5 py-2.5 rounded-xl text-white font-semibold bg-primary hover:bg-primary-container transition-colors">Enviar Feedback</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderSupportUi() {
    const sidebarSupport = document.getElementById('sidebar-support');
    if (sidebarSupport) sidebarSupport.innerHTML = SidebarSupportSection();

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;
    modalRoot.innerHTML = `${state.helpOpen ? HelpModal() : ''}${state.feedbackOpen ? FeedbackModal() : ''}`;
  }

  function clamp(val) {
    return Math.max(0, Math.min(100, Math.round(Number(val) || 0)));
  }

  function scoreColor(score) {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-tertiary-container';
    return 'text-error';
  }

  function barColor(score) {
    if (score >= 80) return 'bg-primary';
    if (score >= 60) return 'bg-tertiary-container';
    return 'bg-error';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function SectionBadge(text) {
    return `<span class="inline-flex px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.12em] font-bold bg-primary-fixed text-primary">${escapeHtml(text)}</span>`;
  }

  function UploadCard() {
    return `
      <label class="block bg-surface-container-low rounded-2xl p-6 cursor-pointer">
        <span class="block text-sm font-semibold mb-4">${escapeHtml(t('uploadTitle'))}</span>
        <input type="file" name="resume_pdf" accept=".pdf" class="hidden" />
        <div id="resume-upload-zone" class="min-h-[240px] rounded-xl2 border-2 border-dashed border-outline-variant/40 bg-surface-container-lowest flex flex-col items-center justify-center text-center px-8 py-8 hover:bg-primary-fixed/30 transition-colors">
          <div class="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-3xl">upload_file</span>
          </div>
          <p class="text-sm text-on-surface-variant leading-relaxed max-w-sm">${escapeHtml(t('uploadBody'))}</p>
          <p id="resume-upload-status" class="mt-4 text-xs font-semibold text-on-surface-variant">${escapeHtml(t('uploadNoFile'))}</p>
        </div>
      </label>
    `;
  }

  function updateUploadStatus(file) {
    const zone = document.getElementById('resume-upload-zone');
    const status = document.getElementById('resume-upload-status');
    if (!zone || !status) return;

    if (!file) {
      zone.classList.remove('border-primary', 'bg-primary-fixed/30');
      zone.classList.add('border-outline-variant/40');
      status.textContent = t('uploadNoFile');
      return;
    }

    zone.classList.remove('border-outline-variant/40');
    zone.classList.add('border-primary', 'bg-primary-fixed/30');
    status.textContent = `${t('uploadSelectedPrefix')} ${file.name}`;
  }

  function SkillBar(skill, score, statusLabel) {
    const val = clamp(score);
    return `
      <div class="space-y-2">
        <div class="flex justify-between gap-3 text-sm font-semibold">
          <span class="truncate">${escapeHtml(skill)}</span>
          <span class="${scoreColor(val)}">${escapeHtml(statusLabel || (val + '%'))}</span>
        </div>
        <div class="h-2.5 bg-surface-container-highest/60 rounded-full overflow-hidden">
          <div class="h-full ${barColor(val)} rounded-full" style="width:${val}%"></div>
        </div>
      </div>
    `;
  }

  function ScoreCard(label, score) {
    const val = clamp(score);
    return `
      <div class="bg-surface-container-low rounded-xl2 p-5 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-on-surface-variant">${escapeHtml(label)}</span>
          <span class="text-sm font-bold ${scoreColor(val)}">${val}%</span>
        </div>
        <div class="h-2 bg-surface-container-highest/70 rounded-full overflow-hidden">
          <div class="h-full ${barColor(val)} rounded-full" style="width:${val}%"></div>
        </div>
      </div>
    `;
  }

  function InsightCard(title, body) {
    return `
      <div class="bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl p-6 shadow-ambient">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">auto_awesome</span>
          <h3 class="font-bold text-lg">${escapeHtml(title)}</h3>
        </div>
        <p class="text-primary-fixed leading-relaxed text-sm">${escapeHtml(body)}</p>
      </div>
    `;
  }

  function SuggestionList(items) {
    const list = (items || []).slice(0, 8);
    return `
      <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <h3 class="text-xl font-bold mb-5">${escapeHtml(t('strategic'))}</h3>
        <ul class="space-y-3">
          ${
            list.length
              ? list
                  .map(
                    (item) =>
                      `<li class="flex items-start gap-3"><span class="material-symbols-outlined text-primary mt-0.5">check_circle</span><span class="text-sm leading-relaxed">${escapeHtml(item)}</span></li>`
                  )
                  .join('')
              : `<li class="text-sm text-on-surface-variant">${escapeHtml(t('emptyHistory'))}</li>`
          }
        </ul>
      </div>
    `;
  }

  function Timeline(items) {
    const rows = (items || []).map((row) => {
      const week = row.week || '?';
      const focus = row.focus || '';
      const action = Array.isArray(row.actions) ? row.actions[0] : '';
      return `
        <div class="relative pl-10 pb-6">
          <div class="absolute left-0 top-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">${week}</div>
          <div class="absolute left-[13px] top-7 bottom-0 w-px bg-surface-container-high"></div>
          <h4 class="text-sm font-bold">Semana ${week}: ${escapeHtml(focus)}</h4>
          <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">${escapeHtml(action)}</p>
        </div>
      `;
    });

    return `
      <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <h3 class="text-xl font-bold mb-5">${escapeHtml(t('timeline'))}</h3>
        <div>${rows.join('') || `<p class="text-sm text-on-surface-variant">-</p>`}</div>
      </div>
    `;
  }

  function HistoryItem(item) {
    const score = clamp(item.weightedMatchScore ?? item.matchScore);
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-';
    return `
      <button data-open="${escapeHtml(item.analysisId)}" class="w-full text-left group rounded-xl2 bg-surface-container-lowest px-5 py-4 hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined">description</span>
          </div>
          <div class="min-w-0">
            <p class="font-semibold truncate">${escapeHtml(item.targetRole || 'Analise sem titulo')}</p>
            <p class="text-xs text-on-surface-variant truncate">${escapeHtml(item.analysisId)}</p>
          </div>
        </div>
        <div class="flex items-center gap-6 md:gap-8">
          <span class="px-3 py-1 rounded-full text-xs font-bold ${score >= 80 ? 'bg-primary-fixed text-primary' : score >= 60 ? 'bg-[#ffdcc5] text-[#904900]' : 'bg-[#ffdad6] text-[#93000a]'}">${score}%</span>
          <span class="text-sm text-on-surface-variant">${escapeHtml(date)}</span>
          <span class="text-sm font-semibold text-primary">${escapeHtml(t('open'))}</span>
        </div>
      </button>
    `;
  }

  function setPage(page) {
    state.page = page;
    render();
  }

  async function loadHistory() {
    try {
      const response = await fetch('/api/v1/analyses');
      if (!response.ok) throw new Error('history');
      state.history = await response.json();
      state.error = '';
      render();
    } catch {
      state.error = t('errorLoad');
      render();
    }
  }

  async function openAnalysis(id) {
    try {
      const response = await fetch(`/api/v1/analyses/${id}`);
      if (!response.ok) throw new Error('analysis');
      state.result = await response.json();
      state.page = 'result';
      state.error = '';
      render();
    } catch {
      state.error = t('errorLoad');
      render();
    }
  }

  async function submitAnalysis(form) {
    state.loading = true;
    state.error = '';
    render();

    const resumeText = form.querySelector('[name="resume_text"]').value.trim();
    const jobDescription = form.querySelector('[name="job_description"]').value.trim();
    const targetRole = form.querySelector('[name="target_role"]').value.trim();
    const file = form.querySelector('[name="resume_pdf"]').files[0];

    try {
      let response;
      if (file) {
        const payload = new FormData();
        payload.append('resume_pdf', file);
        payload.append('job_description', jobDescription);
        payload.append('target_role', targetRole);
        response = await fetch('/api/v1/analyze/pdf', { method: 'POST', body: payload });
      } else {
        response = await fetch('/api/v1/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description: jobDescription,
            target_role: targetRole
          })
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'analyze');

      state.result = data;
      state.page = 'result';
      state.loading = false;
      render();
    } catch (error) {
      state.loading = false;
      state.error = error.message || t('errorLoad');
      render();
    }
  }

  function MatchPage() {
    return `
      <section class="space-y-8">
        ${
          state.error
            ? `<div class="rounded-xl p-4 bg-[#ffdad6] text-[#93000a] font-semibold">${escapeHtml(state.error)}</div>`
            : ''
        }

        <form id="match-form" class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div class="xl:col-span-8 space-y-6">
            <div class="space-y-4">
              ${SectionBadge(t('heroBadge'))}
              <h2 class="text-[2.35rem] leading-[1.08] tracking-[-0.02em] font-semibold max-w-4xl">${escapeHtml(t('heroTitle'))}</h2>
              <p class="text-base text-on-surface-variant max-w-3xl leading-relaxed">${escapeHtml(t('heroSub'))}</p>
            </div>

            ${UploadCard()}

            <div class="bg-surface-container-low rounded-2xl p-6">
              <label class="block text-sm font-semibold mb-3">${escapeHtml(t('resumeLabel'))}</label>
              <textarea name="resume_text" class="w-full h-56 bg-surface-container-lowest border-none rounded-xl2 focus:ring-2 focus:ring-primary/20 p-4 resize-none" placeholder="${escapeHtml(t('resumePlaceholder'))}"></textarea>
            </div>

            <div class="bg-surface-container-low rounded-2xl p-6">
              <label class="block text-sm font-semibold mb-3">${escapeHtml(t('jobLabel'))}</label>
              <textarea name="job_description" class="w-full h-56 bg-surface-container-lowest border-none rounded-xl2 focus:ring-2 focus:ring-primary/20 p-4 resize-none" placeholder="${escapeHtml(t('jobPlaceholder'))}"></textarea>
            </div>
          </div>

          <div class="xl:col-span-4 space-y-6">
            <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
              <div class="text-xs uppercase tracking-[0.1em] font-bold text-on-surface-variant">Fluxo</div>
              <div class="space-y-3">
                ${ScoreCard(t('step1'), 100)}
                ${ScoreCard(t('step2'), 66)}
                ${ScoreCard(t('step3'), 33)}
              </div>
            </div>

            <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
              <h3 class="text-base font-bold mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-primary">target</span>${escapeHtml(t('strategy'))}</h3>
              <label class="block text-xs uppercase tracking-[0.08em] font-bold text-on-surface-variant mb-2">${escapeHtml(t('targetRole'))}</label>
              <input name="target_role" class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20" placeholder="${escapeHtml(t('targetRolePlaceholder'))}" />
            </div>

            <div class="bg-gradient-to-br from-primary/10 to-primary-fixed rounded-2xl p-6 border border-outline-variant/30">
              <h4 class="font-bold text-primary mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-sm">bolt</span>${escapeHtml(t('previewTitle'))}</h4>
              <p class="text-sm text-on-surface-variant leading-relaxed">${escapeHtml(t('previewText'))}</p>
            </div>

            <button ${state.loading ? 'disabled' : ''} class="w-full py-3.5 rounded-2xl text-white font-bold text-base bg-gradient-to-br from-primary to-primary-container shadow-ambient hover:opacity-95 transition-opacity disabled:opacity-50">
              ${state.loading ? escapeHtml(t('running')) : escapeHtml(t('run'))}
            </button>
          </div>
        </form>
      </section>
    `;
  }

  function ResultPage() {
    if (!state.result) {
      return `
        <section class="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-sm">
          <h2 class="text-3xl font-bold mb-2">${escapeHtml(t('noResult'))}</h2>
          <p class="text-on-surface-variant mb-6">${escapeHtml(t('noResultSub'))}</p>
          <button id="go-match" class="px-6 py-3 rounded-xl bg-primary text-white font-semibold">${escapeHtml(t('backToMatch'))}</button>
        </section>
      `;
    }

    const r = state.result;
    const score = clamp(r.weightedMatchScore || r.matchScore || 0);
    const circumference = 2 * Math.PI * 86;
    const offset = circumference - (score / 100) * circumference;

    const skillBars = (r.skillBreakdown || [])
      .slice(0, 8)
      .map((item) =>
        SkillBar(item.skill, item.presentInResume ? 100 * (item.weight || 1) : 25, item.presentInResume ? 'aderente' : 'lacuna')
      )
      .join('');

    const gaps = (r.missingSkills || [])
      .map(
        (skill) =>
          `<div class="px-4 py-3 rounded-xl bg-surface-container-low border-l-4 border-tertiary-container"><p class="font-semibold text-sm">${escapeHtml(skill)}</p></div>`
      )
      .join('');

    return `
      <section class="space-y-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
            <div class="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
              <div class="space-y-4">
                ${SectionBadge(t('resultBadge'))}
                <h2 class="text-4xl leading-tight font-semibold tracking-[-0.02em]">${escapeHtml(t('resultTitle'))}</h2>
                <p class="text-on-surface-variant leading-relaxed">${escapeHtml(r.synthesizedSummary || '')}</p>
                <a href="/api/v1/analyses/${escapeHtml(r.analysisId)}/report" target="_blank" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-br from-primary to-primary-container shadow-ambient">${escapeHtml(t('download'))}<span class="material-symbols-outlined text-base">download</span></a>
              </div>
              <div class="relative w-52 h-52">
                <svg class="progress-ring w-52 h-52" viewBox="0 0 220 220">
                  <circle class="progress-ring__track" cx="110" cy="110" r="86" fill="transparent" stroke-width="16"></circle>
                  <circle class="progress-ring__value" cx="110" cy="110" r="86" fill="transparent" stroke-width="16" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="text-5xl font-bold">${score}%</div>
                  <div class="text-sm font-semibold text-on-surface-variant uppercase tracking-[0.08em]">${escapeHtml(t('weightedScore'))}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-4">
            ${InsightCard(
              t('insight'),
              `${t('provider')}: ${(r.llm && r.llm.provider) || 'nenhum'} | ${t('model')}: ${(r.llm && r.llm.model) || 'nenhum'}`
            )}
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div class="lg:col-span-3 bg-surface-container-low rounded-2xl p-6">
            <h3 class="text-xl font-bold mb-5">${escapeHtml(t('skillsViz'))}</h3>
            <div class="space-y-4">${skillBars || `<p class="text-sm text-on-surface-variant">-</p>`}</div>
          </div>

          <div class="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <h3 class="text-xl font-bold mb-5">${escapeHtml(t('gaps'))}</h3>
            <div class="space-y-3">${gaps || `<p class="text-sm text-on-surface-variant">${escapeHtml(t('noGaps'))}</p>`}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-4">${Timeline(r.studyPlan || [])}</div>
          <div class="lg:col-span-8">${SuggestionList(r.resumeOptimizationSuggestions || [])}</div>
        </div>
      </section>
    `;
  }

  function HistoryPage() {
    const items = (state.history || []).map((item) => HistoryItem(item)).join('');

    return `
      <section class="space-y-8">
        <header class="space-y-3">
          <h2 class="text-[2.35rem] leading-[1.08] tracking-[-0.02em] font-semibold">${escapeHtml(t('historyTitle'))}</h2>
          <p class="text-base text-on-surface-variant">${escapeHtml(t('historySub'))}</p>
        </header>

        ${
          state.error
            ? `<div class="rounded-xl p-4 bg-[#ffdad6] text-[#93000a] font-semibold">${escapeHtml(state.error)}</div>`
            : ''
        }

        <div class="space-y-3">
          ${items || `<div class="bg-surface-container-lowest rounded-xl2 px-5 py-8 text-on-surface-variant">${escapeHtml(t('emptyHistory'))}</div>`}
        </div>
      </section>
    `;
  }

  function syncChromeText() {
    const setText = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    };

    setText('nav-other-text', t('navOther'));
    setText('nav-other-link', t('navOtherLink'));
    setText('side-nav-match', t('navMatch'));
    setText('side-nav-result', t('navResult'));
    setText('side-nav-history', t('navHistory'));
    setText('new-analysis', t('newAnalysis'));

    document.documentElement.lang = 'pt-BR';
  }

  function bindEvents() {
    document.querySelectorAll('[data-nav]').forEach((node) => {
      node.addEventListener('click', () => {
        const page = node.getAttribute('data-nav');
        if (page === 'history') loadHistory();
        setPage(page);
      });
    });

    const form = document.getElementById('match-form');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitAnalysis(form);
      });

      const fileInput = form.querySelector('[name="resume_pdf"]');
      if (fileInput) {
        fileInput.addEventListener('change', () => {
          const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
          updateUploadStatus(file);
        });
        updateUploadStatus(fileInput.files && fileInput.files[0] ? fileInput.files[0] : null);
      }
    }

    document.querySelectorAll('[data-open]').forEach((node) => {
      node.addEventListener('click', () => openAnalysis(node.getAttribute('data-open')));
    });

    const goMatch = document.getElementById('go-match');
    if (goMatch) goMatch.addEventListener('click', () => setPage('match'));

    const openHelp = document.getElementById('open-help');
    if (openHelp) {
      openHelp.addEventListener('click', () => {
        state.helpOpen = true;
        render();
      });
    }

    const openFeedback = document.getElementById('open-feedback');
    if (openFeedback) {
      openFeedback.addEventListener('click', () => {
        state.feedbackOpen = true;
        render();
      });
    }

    const closeHelp = document.getElementById('close-help');
    if (closeHelp) {
      closeHelp.addEventListener('click', () => {
        state.helpOpen = false;
        render();
      });
    }

    const closeFeedback = document.getElementById('close-feedback');
    if (closeFeedback) {
      closeFeedback.addEventListener('click', () => {
        state.feedbackOpen = false;
        render();
      });
    }

    document.querySelectorAll('[data-close-modal]').forEach((node) => {
      node.addEventListener('click', (event) => {
        if (event.target !== node) return;
        if (node.getAttribute('data-close-modal') === 'help') state.helpOpen = false;
        if (node.getAttribute('data-close-modal') === 'feedback') state.feedbackOpen = false;
        render();
      });
    });

    const feedbackInput = document.getElementById('feedback-input');
    if (feedbackInput) {
      feedbackInput.addEventListener('input', (event) => {
        state.feedbackText = event.target.value;
      });
    }

    const sendFeedback = document.getElementById('send-feedback');
    if (sendFeedback) {
      sendFeedback.addEventListener('click', () => {
        const feedback = (state.feedbackText || '').trim();
        if (!feedback) return;
        console.log('[RAGFlow Feedback]', feedback);
        state.feedbackText = '';
        state.feedbackOpen = false;
        render();
      });
    }

    const newAnalysis = document.getElementById('new-analysis');
    if (newAnalysis && !newAnalysis.dataset.bound) {
      newAnalysis.dataset.bound = '1';
      newAnalysis.addEventListener('click', () => setPage('match'));
    }
  }

  function render() {
    if (state.page === 'match') app.innerHTML = MatchPage();
    if (state.page === 'result') app.innerHTML = ResultPage();
    if (state.page === 'history') app.innerHTML = HistoryPage();
    syncChromeText();
    renderSupportUi();
    bindEvents();
  }

  render();
})();

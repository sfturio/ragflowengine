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
    navMatch: 'Análise de Match',
    navResult: 'Resultado de Carreira',
    navHistory: 'Histórico',
    navAbout: 'Sobre',
    newAnalysis: 'Nova Análise',
    heroBadge: 'RAGFlow Análise de Match',
    heroTitle: 'Entenda como seu currículo combina com vagas reais',
    heroSub: 'Análise semântica com transparência determinística e orientações práticas.',
    uploadTitle: 'Contexto do Currículo',
    uploadBody: 'Clique para enviar ou arraste PDF (ate 8MB)',
    uploadNoFile: 'Nenhum arquivo selecionado ainda.',
    uploadSelectedPrefix: 'PDF selecionado:',
    resumeLabel: 'Texto do Currículo',
    resumePlaceholder: 'Se preferir, cole o texto do currículo aqui. Se você já enviou PDF, pode deixar em branco.',
    jobLabel: 'Descrição da Vaga',
    jobPlaceholder: 'Cole aqui a descrição da vaga-alvo...',
    strategy: 'Parâmetros de Estratégia',
    targetRole: 'Cargo Alvo',
    targetRolePlaceholder: 'ex.: Engenheiro de Software Senior',
    step1: 'Currículo carregado',
    step2: 'Contexto da vaga mapeado',
    step3: 'Análise semântica',
    run: 'Rodar Análise de Carreira',
    running: 'Analisando...',
    previewTitle: 'Prévia da Análise',
    previewText: 'Match de skills, evidencias acionaveis, roadmap personalizado e proximos passos em um fluxo unico.',
    noResult: 'Sem resultado ainda',
    noResultSub: 'Rode uma análise na tela de Match primeiro.',
    backToMatch: 'Ir para Análise de Match',
    resultBadge: 'Resultado de Carreira',
    resultTitle: 'Avaliação de Match',
    weightedScore: 'Match',
    insight: 'Insight de IA',
    download: 'Baixar Relatório',
    skillsViz: 'Insights de Competencias',
    skillsHelper: 'Veja como suas competencias se conectam com a vaga analisada.',
    gaps: 'Skills em Gap',
    noGaps: 'Nenhum gap relevante encontrado.',
    timeline: 'Roadmap de Carreira Personalizado',
    strategic: 'Proximos passos para aumentar seu Match',
    historyTitle: 'Histórico',
    historySub: 'Linha do tempo das análises anteriores.',
    open: 'Abrir',
    emptyHistory: 'Nenhuma análise ainda.',
    model: 'Modelo',
    provider: 'Provedor',
    errorLoad: 'Não foi possível carregar os dados. Tente novamente.',
    aboutTitle: 'Sobre o RAGFlow Engine',
    aboutSubtitle:
      'Uma explicação técnica de como o RAGFlow organiza contexto de carreira e transforma análise semântica em orientação prática.',
    aboutWhatIsTitle: 'Contexto do Projeto',
    aboutWhatIsBody:
      'Candidatos em início de carreira recebem sinais dispersos entre vagas, fóruns e dicas informais. O projeto centraliza esse contexto para reduzir decisões baseadas em tentativa e erro.',
    aboutHowTitle: 'Abordagem Técnica',
    aboutHowBody:
      'O pipeline aplica embeddings em currículo, descrição da vaga e base curada de conteúdo, recupera evidências relevantes e gera recomendações ancoradas nesse contexto. A saída prioriza lacunas, próximos passos e hipóteses de evolução profissional.',
    aboutLimitsTitle: 'Decisões de Engenharia',
    aboutLimitsBody:
      'A solução separa indexação, recuperação e geração para equilibrar latência, manutenção e escala. O backend mantém componentes substituíveis para trocar modelos, ajustar ranking e evoluir sem reescrever o fluxo completo.',
    aboutTechTitle: 'Valor para o Usuário',
    aboutTechBody:
      'Na prática, o usuário ganha direção: prioriza estudos com critério, ajusta o portfólio com mais velocidade e aplica para vagas com menos incerteza sobre o que realmente importa para cada alvo.',
    aboutHumanTitle: 'Perspectiva Humana',
    aboutHumanBody:
      'Construir esse produto foi uma forma de tornar decisões de carreira menos confusas para quem está tentando crescer em um mercado com sinais nem sempre claros.'
  };

  const t = (key) => UI_TEXT[key] || key;
  const THEME_KEY = 'ai-career-suite-theme';
  const ICONS = {
    match: '\u{1F3AF}',
    study: '\u{1F4DA}',
    skill: '\u{1F9E0}',
    career: '\u{1F680}'
  };

  function getPreferredTheme() {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateThemeToggle(theme) {
    const toggleText = document.getElementById('theme-toggle-text');
    if (toggleText) toggleText.textContent = theme === 'dark' ? 'Dark' : 'Light';

    const toggleIcon = document.getElementById('theme-toggle-icon');
    if (toggleIcon) toggleIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';

    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    window.localStorage.setItem(THEME_KEY, theme);
    updateThemeToggle(theme);
  }

  function bindThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton || toggleButton.dataset.bound === '1') return;

    toggleButton.dataset.bound = '1';
    toggleButton.addEventListener('click', () => {
      const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

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
            <li>Envie seu currículo em PDF ou cole o texto.</li>
            <li>Adicione a descrição da vaga que você quer atingir.</li>
            <li>Opcionalmente, defina seu cargo alvo.</li>
            <li>Rode a análise.</li>
            <li>Revise os scores, insights e sugestões de melhoria.</li>
            <li>Baixe ou revise sua análise depois no Histórico.</li>
          </ol>

          <section class="mb-10">
            <h3 class="text-xl font-bold mb-4">Perguntas Frequentes</h3>
            <div class="space-y-4 text-[15px] leading-relaxed">
              <div><p class="font-semibold">Esta análise é 100% precisa?</p><p class="text-on-surface-variant">Não. Esta ferramenta combina análise determinística e assistência de IA para orientar, sem garantias absolutas.</p></div>
              <div><p class="font-semibold">Você armazena meu currículo?</p><p class="text-on-surface-variant">As análises podem ser armazenadas localmente para melhorar sua experiência e manter histórico.</p></div>
              <div><p class="font-semibold">Posso usar isso em candidaturas reais?</p><p class="text-on-surface-variant">Sim. A ferramenta ajuda a otimizar estrutura e posicionamento, mas ajustes finais sempre são recomendados.</p></div>
              <div><p class="font-semibold">Por que os scores diferem de outras ferramentas?</p><p class="text-on-surface-variant">Cada plataforma usa heurísticas e modelos diferentes. Este app prioriza clareza, transparência e insights acionáveis.</p></div>
              <div><p class="font-semibold">Qual a diferença entre ATSFlow e RAGFlow?</p><p class="text-on-surface-variant">ATSFlow foca em otimização técnica para ATS. RAGFlow foca em match semântico e estratégia de carreira.</p></div>
            </div>
          </section>

          <section>
            <h3 class="text-xl font-bold mb-4">Dicas para melhores resultados</h3>
            <ul class="space-y-2 text-[15px] leading-relaxed list-disc pl-5 text-on-surface-variant">
              <li>Use descrições de vaga completas.</li>
              <li>Evite currículos extremamente curtos.</li>
              <li>Foque em conquistas mensuráveis.</li>
              <li>Mantenha a formatação simples e amigável para ATS.</li>
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
          <label for="feedback-input" class="block text-sm font-semibold mb-3">Compartilhe sua sugestão ou reporte um problema</label>
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
    if (score >= 75) return 'text-[#15803D]';
    if (score >= 50) return 'text-[#92400E]';
    return 'text-error';
  }

  function barColor(score) {
    if (score >= 75) return 'bg-[#22C55E]';
    if (score >= 50) return 'bg-[#D97706]';
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

  function getDisplaySummary(value) {
    const clean = String(value || '')
      .replace(/[*_`>#]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/:$/, '')
      .trim();
    if (!clean) return '';
    if (/^s[ií]ntese$/i.test(clean)) return '';
    if (/^resumo$/i.test(clean)) return '';
    return clean;
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

  function getSkillLevelLabel(level) {
    if (level === 'high') return 'Forte no seu curriculo';
    if (level === 'medium') return 'Pode fortalecer';
    return 'Precisa desenvolver';
  }

  function getSkillTooltip(level) {
    if (level === 'high') return 'Essa skill aparece claramente nas suas experiencias ou projetos.';
    if (level === 'medium') return 'A skill foi encontrada, mas pode ser melhor evidenciada com resultados concretos.';
    return 'A skill e relevante para a vaga, mas nao foi encontrada com evidencia suficiente no curriculo.';
  }

  function levelPill(level) {
    if (level === 'high') {
      return `<span title="${escapeHtml(getSkillTooltip(level))}" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#e6f4ea] text-[#1b5e20] border border-[#b7dfbf]">Forte no seu curriculo</span>`;
    }
    if (level === 'medium') {
      return `<span title="${escapeHtml(getSkillTooltip(level))}" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#fff4e5] text-[#8a4b00] border border-[#ffd7a8]">Pode fortalecer</span>`;
    }
    return `<span title="${escapeHtml(getSkillTooltip(level))}" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#fdeaea] text-[#93000a] border border-[#f7c9c9]">Precisa desenvolver</span>`;
  }

  function toSkillInsightItem(item) {
    const score = clamp(item.score != null ? item.score : item.presentInResume ? 100 * (item.weight || 1) : 20);
    const level = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
    return {
      ...item,
      score,
      level,
      explanation: item.explanation || 'Pontuacao estimada por relevancia da skill na vaga e evidencias no curriculo.',
      evidenceSnippet: item.evidenceSnippet || item.evidence || null,
      improveSuggestion:
        item.improveSuggestion || 'Adicione um bullet tecnico com contexto, stack e resultado mensuravel.'
    };
  }

  function ScoreCard(label, score) {
    const val = clamp(score);
    return `
      <div class="premium-card premium-card-soft premium-hover p-7 space-y-3">
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

  function SkillInsightPanel(items) {
    const rows = (items || []).map((raw) => toSkillInsightItem(raw));
    return `
      <div class="premium-card premium-card-soft premium-hover p-8">
        <p class="mono-label uppercase text-on-surface-variant/70 mb-2">Inteligência de competências</p>
        <div class="flex items-start justify-between gap-4 mb-4">
          <h3 class="text-xl font-bold">${escapeHtml(t('skillsViz'))}</h3>
          <span class="text-xl" title="Skills">${ICONS.skill}</span>
        </div>
        <p class="text-sm text-on-surface-variant mb-6">${escapeHtml(t('skillsHelper'))}</p>
        <div class="space-y-4">
          ${
            rows.length
              ? rows
                  .map(
                    (item) =>
                      `<details open class="group premium-hover rounded-2xl border border-outline-variant/60 overflow-hidden bg-surface-container-lowest dark:bg-slate-900/70" style="box-shadow: var(--card-shadow-soft);">
                        <summary class="list-none cursor-pointer px-4 py-4 flex flex-wrap gap-3 items-center justify-between">
                          <div class="min-w-0 flex-1">
                            <p class="text-sm font-semibold truncate text-on-surface dark:text-slate-100">${escapeHtml(item.skill)}</p>
                            <div class="mt-2 h-3 bg-[#E9EEF7] dark:bg-slate-700/70 rounded-full overflow-hidden">
                              <div class="h-full ${barColor(item.score)} rounded-full" style="width:${item.score}%; transition: width 320ms ease"></div>
                            </div>
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <span class="text-xs font-bold ${scoreColor(item.score)}">${item.score}%</span>
                            ${levelPill(item.level)}
                            <span class="material-symbols-outlined text-on-surface-variant dark:text-slate-300 transition-transform group-open:rotate-180">expand_more</span>
                          </div>
                        </summary>
                        <div class="px-4 pb-5 pt-3 space-y-3 border-t border-outline-variant/70 bg-surface-container-low/70 dark:bg-slate-900/45">
                          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Por que esta pontuacao:</span> ${escapeHtml(item.explanation)}</p>
                          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Onde foi detectada:</span> ${escapeHtml(item.evidenceSnippet || 'Sem trecho relevante detectado no curriculo.')}</p>
                          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Como melhorar:</span> ${escapeHtml(item.improveSuggestion)}</p>
                        </div>
                      </details>`
                  )
                  .join('')
              : `<p class="text-sm text-on-surface-variant">-</p>`
          }
        </div>
      </div>
    `;
  }

  function toNextAction(item) {
    if (typeof item === 'string') {
      return {
        icon: ICONS.career,
        priority: 'medium',
        category: 'Career',
        title: item,
        whyMatch: 'Esta acao reforca sinais de aderencia para a vaga.',
        execution: 'Execute com bullets tecnicos e resultados mensuraveis.',
        recruiterGain: 'Melhora a percepcao de senioridade e consistencia.'
      };
    }
    return {
      icon: item.icon || ICONS.career,
      priority: item.priority || 'medium',
      category: item.category || 'Career',
      title: item.title || 'Acao recomendada',
      whyMatch: item.whyMatch || 'Aumenta conexao entre curriculo e vaga.',
      execution: item.execution || 'Transforme em entrega concreta no curriculo/portfolio.',
      recruiterGain: item.recruiterGain || 'Eleva confianca do recrutador no seu fit.'
    };
  }

  function iconByCategory(category) {
    const normalized = String(category || '').toLowerCase();
    if (normalized.includes('match')) return ICONS.match;
    if (normalized.includes('study')) return ICONS.study;
    if (normalized.includes('skill')) return ICONS.skill;
    return ICONS.career;
  }

  function priorityAccent(priority) {
    const normalized = String(priority || ' ').toLowerCase();
    if (normalized === 'high') return { tint: '#FFF1F2', accent: '#E11D48', label: 'HIGH' };
    if (normalized === 'low') return { tint: '#EFF6FF', accent: '#2563EB', label: 'LOW' };
    return { tint: '#FFFBEB', accent: '#D97706', label: 'MEDIUM' };
  }

  function priorityLabelPt(priority) {
    const normalized = String(priority || '').toLowerCase();
    if (normalized === 'high') return 'ALTA PRIORIDADE';
    if (normalized === 'medium') return 'MÉDIA PRIORIDADE';
    return 'BAIXA PRIORIDADE';
  }

  function priorityRank(priority) {
    const normalized = String(priority || '').toLowerCase();
    if (normalized === 'high') return 0;
    if (normalized === 'medium') return 1;
    if (normalized === 'low') return 2;
    return 3;
  }

  function sortByPriority(items) {
    return items
      .map((item, idx) => ({ item, idx }))
      .sort((a, b) => {
        const rankDiff = priorityRank(a.item.priority) - priorityRank(b.item.priority);
        if (rankDiff !== 0) return rankDiff;
        return a.idx - b.idx;
      })
      .map((entry) => entry.item);
  }

  function ensurePriorityMix(items) {
    const list = (items || []).map((item) => ({
      ...item,
      priority: String(item.priority || '').toLowerCase() || null
    }));
    if (list.length < 3) return list;

    const hasHigh = list.some((item) => item.priority === 'high');
    const hasMedium = list.some((item) => item.priority === 'medium');
    const hasLow = list.some((item) => item.priority === 'low');
    if (hasHigh && hasMedium && hasLow) return list;

    const needed = [];
    if (!hasHigh) needed.push('high');
    if (!hasMedium) needed.push('medium');
    if (!hasLow) needed.push('low');

    for (let i = 0; i < needed.length && i < list.length; i += 1) {
      list[i] = { ...list[i], priority: needed[i] };
    }

    return list;
  }
  function NextActionsPanel(items) {
    const mixed = ensurePriorityMix((items || []).map((item) => toNextAction(item)).slice(0, 8));
    const list = sortByPriority(mixed);
    return `
      <div class="premium-card premium-card-soft premium-hover p-8">
        <p class="mono-label uppercase text-on-surface-variant/70 mb-2">Ações estratégicas</p>
        <div class="flex items-center gap-2 mb-5">
          <span class="text-xl">${ICONS.career}</span>
          <h3 class="text-xl font-bold">${escapeHtml(t('strategic'))}</h3>
        </div>
        <div class="space-y-4">
          ${
            list.length
              ? list
                  .map((item, idx) => {
                    const priority = item.priority || (idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low');
                    const accent = priorityAccent(priority);
                    return `<details open class="group premium-hover rounded-2xl border border-outline-variant/60 overflow-hidden bg-surface-container-lowest dark:bg-slate-900/70" style="border-left:4px solid ${accent.accent}; box-shadow: var(--card-shadow-soft);">
                        <summary class="list-none cursor-pointer px-4 py-4 flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <p class="text-sm font-semibold break-words text-on-surface dark:text-slate-100">${escapeHtml(item.title)}</p>
                            <div class="mt-1 flex items-center gap-2 flex-wrap">
                              <span class="mono-label uppercase px-2 py-1 rounded text-[10px] border" style="color:${accent.accent}; background:${accent.tint}; border-color:${accent.accent}33;">${priorityLabelPt(priority)}</span>
                              <p class="text-xs text-on-surface-variant dark:text-slate-300">${escapeHtml(item.category)}</p>
                            </div>
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <span class="text-lg">${iconByCategory(item.category) || item.icon}</span>
                            <span class="material-symbols-outlined text-on-surface-variant dark:text-slate-300 transition-transform group-open:rotate-180">expand_more</span>
                          </div>
                        </summary>
                        <div class="px-4 pb-5 pt-3 space-y-3 border-t border-outline-variant/70 bg-surface-container-low/70 dark:bg-slate-900/45">
                          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Por que aumenta o match:</span> ${escapeHtml(item.whyMatch)}</p>
                          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Como executar:</span> ${escapeHtml(item.execution)}</p>
                          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Ganho na percepcao do recrutador:</span> ${escapeHtml(item.recruiterGain)}</p>
                        </div>
                      </details>`;
                  })
                  .join('')
              : `<p class="text-sm text-on-surface-variant">${escapeHtml(t('emptyHistory'))}</p>`
          }
        </div>
      </div>
    `;
  }

  function toRoadmapWeek(row) {
    return {
      week: row.week || '?',
      title: row.title || row.focus || '',
      focusObjective: row.focusObjective || row.focus || '',
      practicalTask: row.practicalTask || (Array.isArray(row.actions) ? row.actions[0] : ''),
      deliverable: row.deliverable || '',
      careerImpact: row.careerImpact || ''
    };
  }

  function CareerRoadmap(items) {
    const rows = (items || []).map((raw, idx) => {
      const row = toRoadmapWeek(raw);
      const toneClass = idx % 2 === 0 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-amber-50 dark:bg-amber-950/25';
      const nodeColor = idx % 2 === 0 ? '#2563EB' : '#D97706';
      return `
        <article class="relative pl-8 rounded-2xl border border-outline-variant/60 p-6 space-y-3 premium-hover ${toneClass}" style="box-shadow: var(--card-shadow-soft);">
          <div class="absolute left-3 top-0 bottom-0 w-px bg-[#D8E0F4] dark:bg-slate-700/80"></div>
          <div class="absolute left-[7px] top-6 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900" style="background:${nodeColor};"></div>
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-sm font-bold text-on-surface dark:text-slate-100">Semana ${escapeHtml(row.week)} - ${escapeHtml(row.title)}</h4>
            <span class="text-base">${ICONS.study}</span>
          </div>
          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Objetivo:</span> ${escapeHtml(row.focusObjective)}</p>
          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Tarefa pratica:</span> ${escapeHtml(row.practicalTask)}</p>
          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Entregavel:</span> ${escapeHtml(row.deliverable || '-')}</p>
          <p class="text-sm leading-relaxed text-on-surface dark:text-slate-200"><span class="font-semibold">Impacto de carreira:</span> ${escapeHtml(row.careerImpact || '-')}</p>
        </article>
      `;
    });

    return `
      <div class="premium-card premium-card-soft premium-hover p-8">
        <p class="mono-label uppercase text-on-surface-variant/70 mb-2">Roadmap guiado</p>
        <div class="flex items-center gap-2 mb-5">
          <span class="text-xl">${ICONS.study}</span>
          <h3 class="text-xl font-bold">${escapeHtml(t('timeline'))}</h3>
        </div>
        <div class="relative space-y-4"><div class="absolute left-3 top-2 bottom-2 w-px bg-[#D8E0F4] dark:bg-slate-700/80"></div>${rows.join('') || `<p class="text-sm text-on-surface-variant">-</p>`}</div>
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
            <p class="font-semibold truncate">${escapeHtml(item.targetRole || 'Análise sem título')}</p>
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
        payload.append('resume_text', resumeText);
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

            <div class="bg-gradient-to-br from-primary/10 to-primary-fixed dark:from-primary/25 dark:to-[#1e293b] rounded-2xl p-6 border border-outline-variant/30 dark:border-slate-500/30">
              <h4 class="font-bold text-primary dark:text-indigo-200 mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-sm">bolt</span>${escapeHtml(t('previewTitle'))}</h4>
              <p class="text-sm text-slate-700 dark:text-slate-100/90 leading-relaxed">${escapeHtml(t('previewText'))}</p>
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
    const summaryText = getDisplaySummary(r.synthesizedSummary);
    const score = clamp(r.weightedMatchScore || r.matchScore || 0);
    const circumference = 2 * Math.PI * 86;
    const offset = circumference - (score / 100) * circumference;

    return `
      <section class="space-y-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
            <div class="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
              <div class="space-y-4">
                ${SectionBadge(t('resultBadge'))}
                <h2 class="text-4xl leading-tight font-semibold tracking-[-0.02em]">${escapeHtml(t('resultTitle'))}</h2>
                ${summaryText ? `<p class="text-on-surface-variant leading-relaxed">${escapeHtml(summaryText)}</p>` : ''}
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

        ${SkillInsightPanel((r.skillBreakdown || []).slice(0, 12))}

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-5">${CareerRoadmap(r.careerRoadmap || r.studyPlan || [])}</div>
          <div class="lg:col-span-7">${NextActionsPanel(r.nextActions || r.resumeOptimizationSuggestions || [])}</div>
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

  function AboutPage() {
    return `
      <section class="space-y-8">
        <header class="space-y-3">
          <h2 class="text-[2.35rem] leading-[1.08] tracking-[-0.02em] font-semibold">${escapeHtml(t('aboutTitle'))}</h2>
          <p class="text-base text-on-surface-variant max-w-3xl">${escapeHtml(t('aboutSubtitle'))}</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <article class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-3">
            <h3 class="text-xl font-bold">${escapeHtml(t('aboutWhatIsTitle'))}</h3>
            <p class="text-on-surface-variant leading-relaxed">${escapeHtml(t('aboutWhatIsBody'))}</p>
          </article>
          <article class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-3">
            <h3 class="text-xl font-bold">${escapeHtml(t('aboutHowTitle'))}</h3>
            <p class="text-on-surface-variant leading-relaxed">${escapeHtml(t('aboutHowBody'))}</p>
          </article>
          <article class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-3">
            <h3 class="text-xl font-bold">${escapeHtml(t('aboutLimitsTitle'))}</h3>
            <p class="text-on-surface-variant leading-relaxed">${escapeHtml(t('aboutLimitsBody'))}</p>
          </article>
          <article class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-3">
            <h3 class="text-xl font-bold">${escapeHtml(t('aboutTechTitle'))}</h3>
            <p class="text-on-surface-variant leading-relaxed">${escapeHtml(t('aboutTechBody'))}</p>
          </article>
          <article class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-3">
            <h3 class="text-xl font-bold">${escapeHtml(t('aboutHumanTitle'))}</h3>
            <p class="text-on-surface-variant leading-relaxed">${escapeHtml(t('aboutHumanBody'))}</p>
          </article>
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
    setText('side-nav-about', t('navAbout'));
    setText('new-analysis', t('newAnalysis'));

    updateThemeToggle(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    document.documentElement.lang = 'pt-BR';
  }

  function syncSideNavActiveState() {
    document.querySelectorAll('[data-nav]').forEach((node) => {
      const page = node.getAttribute('data-nav');
      const isActive = page === state.page;
      node.className = isActive
        ? 'w-full text-left px-4 py-3 rounded-xl bg-surface-container-lowest text-primary shadow-sm font-semibold flex items-center gap-3'
        : 'w-full text-left px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors font-semibold flex items-center gap-3';
    });
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
      sendFeedback.addEventListener('click', async () => {
        const feedback = (state.feedbackText || '').trim();
        if (!feedback) return;
        try {
          sendFeedback.disabled = true;
          sendFeedback.textContent = 'Enviando...';
          const response = await fetch('/api/v1/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: feedback })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Não foi possível enviar feedback.');
          state.feedbackText = '';
          state.feedbackOpen = false;
          render();
        } catch (error) {
          console.error('[RAGFlow Feedback Error]', error.message);
        } finally {
          sendFeedback.disabled = false;
          sendFeedback.textContent = 'Enviar Feedback';
        }
      });
    }

    const newAnalysis = document.getElementById('new-analysis');
    if (newAnalysis && !newAnalysis.dataset.bound) {
      newAnalysis.dataset.bound = '1';
      newAnalysis.addEventListener('click', () => setPage('match'));
    }

    bindThemeToggle();
  }

  function render() {
    if (state.page === 'match') app.innerHTML = MatchPage();
    if (state.page === 'result') app.innerHTML = ResultPage();
    if (state.page === 'history') app.innerHTML = HistoryPage();
    if (state.page === 'about') app.innerHTML = AboutPage();
    syncChromeText();
    syncSideNavActiveState();
    renderSupportUi();
    bindEvents();
  }

  applyTheme(getPreferredTheme());
  render();
})();






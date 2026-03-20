(function () {
  const app = document.getElementById('app');
  const state = {
    page: 'match',
    result: null,
    history: [],
    loading: false,
    error: '',
    lang: localStorage.getItem('rag_ui_lang') || 'en'
  };

  const I18N = {
    en: {
      navOther: 'Check our other app:',
      navOtherLink: 'ATSFlow Engine',
      navMatch: 'Match Analysis',
      navResult: 'Career Result',
      navHistory: 'History',
      newAnalysis: 'New Analysis',
      heroTag: 'RAGFlow Match Engine',
      heroTitle: 'Understand how your resume matches real jobs',
      heroSub: 'Semantic and contextual analysis with deterministic explanations and optional LLM synthesis.',
      upload: 'Resume Context',
      uploadHint: 'Click to upload or drag and drop PDF up to 8MB',
      resumeText: 'Resume Text',
      resumePlaceholder: 'Paste your resume text...',
      jobDescription: 'Job Description',
      jobPlaceholder: 'Paste target job description...',
      targetRole: 'Target Role',
      targetPlaceholder: 'e.g. Senior Product Designer',
      preview: 'Analysis Preview',
      previewSub: 'RAGFlow will generate match score, weighted score, skill breakdown, gaps, insights and study plan.',
      run: 'Run Career Analysis',
      running: 'Running analysis...',
      noResult: 'No result yet',
      runFirst: 'Run a match analysis first.',
      goMatch: 'Go to Match Analysis',
      weighted: 'Weighted Match',
      download: 'Download Report',
      aiInsight: 'AI Strategic Insight',
      skillViz: 'Skill Match Visualization',
      gaps: 'Gap Skills',
      noGaps: 'No relevant skill gaps detected.',
      studyPlan: 'Study Plan Timeline',
      suggestions: 'Resume Optimization Suggestions',
      historyTitle: 'History',
      historySub: 'Review your past intelligent matching analyses.',
      noHistory: 'No analyses yet.'
    },
    pt: {
      navOther: 'Confira nosso outro app:',
      navOtherLink: 'ATSFlow Engine',
      navMatch: 'Analise de Match',
      navResult: 'Resultado de Carreira',
      navHistory: 'Historico',
      newAnalysis: 'Nova Analise',
      heroTag: 'RAGFlow Match Engine',
      heroTitle: 'Entenda como seu curriculo combina com vagas reais',
      heroSub: 'Analise semantica e contextual com explicacoes deterministicas e sintese opcional por LLM.',
      upload: 'Contexto do Curriculo',
      uploadHint: 'Clique para enviar ou arraste um PDF de ate 8MB',
      resumeText: 'Texto do curriculo',
      resumePlaceholder: 'Cole o texto do seu curriculo...',
      jobDescription: 'Descricao da vaga',
      jobPlaceholder: 'Cole a descricao da vaga alvo...',
      targetRole: 'Cargo alvo',
      targetPlaceholder: 'ex.: Senior Product Designer',
      preview: 'Previa da analise',
      previewSub: 'O RAGFlow vai gerar match score, score ponderado, skill breakdown, gaps, insights e plano de estudo.',
      run: 'Rodar analise de carreira',
      running: 'Analisando...',
      noResult: 'Sem resultado ainda',
      runFirst: 'Rode uma analise de match primeiro.',
      goMatch: 'Ir para Analise de Match',
      weighted: 'Match ponderado',
      download: 'Baixar relatorio',
      aiInsight: 'Insight estrategico de IA',
      skillViz: 'Visualizacao de Skills',
      gaps: 'Skills ausentes',
      noGaps: 'Nenhuma lacuna relevante detectada.',
      studyPlan: 'Timeline do plano de estudo',
      suggestions: 'Sugestoes para otimizar curriculo',
      historyTitle: 'Historico',
      historySub: 'Revise suas analises anteriores de match inteligente.',
      noHistory: 'Nenhuma analise ainda.'
    }
  };

  const t = (key) => I18N[state.lang][key] || I18N.en[key] || key;

  function syncTopNavText() {
    const map = {
      'nav-other-text': t('navOther'),
      'nav-other-link': t('navOtherLink'),
      'side-nav-match': t('navMatch'),
      'side-nav-result': t('navResult'),
      'side-nav-history': t('navHistory'),
      'new-analysis': t('newAnalysis')
    };

    Object.entries(map).forEach(([id, text]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = text;
    });

    const btn = document.getElementById('translate-btn');
    if (btn) btn.textContent = state.lang === 'pt' ? 'EN' : 'PT';
    document.documentElement.lang = state.lang === 'pt' ? 'pt-BR' : 'en';
  }

  function setPage(page) {
    state.page = page;
    render();
  }

  function toggleLang() {
    state.lang = state.lang === 'pt' ? 'en' : 'pt';
    localStorage.setItem('rag_ui_lang', state.lang);
    render();
  }

  function scoreColor(score) {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-tertiary-container';
    return 'text-error';
  }

  function progressColor(score) {
    if (score >= 80) return 'bg-primary';
    if (score >= 60) return 'bg-tertiary-container';
    return 'bg-error';
  }

  async function loadHistory() {
    try {
      const response = await fetch('/api/v1/analyses');
      if (!response.ok) throw new Error('Failed to load history');
      state.history = await response.json();
      render();
    } catch (error) {
      state.error = error.message;
      render();
    }
  }

  async function openAnalysis(id) {
    try {
      const response = await fetch('/api/v1/analyses/' + id);
      if (!response.ok) throw new Error('Failed to load analysis');
      state.result = await response.json();
      state.page = 'result';
      render();
    } catch (error) {
      state.error = error.message;
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
          body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription, target_role: targetRole })
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze');

      state.result = data;
      state.page = 'result';
      state.loading = false;
      render();
    } catch (error) {
      state.error = error.message;
      state.loading = false;
      render();
    }
  }

  function matchPage() {
    return `
      <div class="space-y-10">
        <header class="text-center space-y-4 max-w-3xl mx-auto">
          <span class="text-primary font-semibold text-xs tracking-widest uppercase">${t('heroTag')}</span>
          <h1 class="text-[2.75rem] leading-tight font-bold tracking-tight">${t('heroTitle')}</h1>
          <p class="text-on-surface-variant text-lg leading-relaxed">${t('heroSub')}</p>
        </header>

        ${state.error ? `<div class="bg-error-container text-on-error-container rounded-xl p-4 font-medium">${state.error}</div>` : ''}

        <form id="match-form" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-7 space-y-8">
            <label class="bg-surface-container-low rounded-xl p-8 group transition-all block">
              <span class="block text-sm font-semibold mb-4">${t('upload')}</span>
              <input type="file" name="resume_pdf" accept=".pdf" class="hidden" />
              <span class="border-2 border-dashed border-outline-variant/30 rounded-lg p-12 flex flex-col items-center justify-center bg-surface-container-lowest group-hover:bg-primary/5 transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-4xl text-primary/40 mb-4">upload_file</span>
                <span class="text-sm text-on-surface-variant text-center">${t('uploadHint')}</span>
              </span>
            </label>

            <div class="bg-surface-container-low rounded-xl p-8">
              <label class="block text-sm font-semibold mb-4">${t('resumeText')}</label>
              <textarea name="resume_text" class="w-full h-56 bg-surface-container-lowest rounded-lg border-none focus:ring-2 focus:ring-primary/20 p-4 resize-none" placeholder="${t('resumePlaceholder')}"></textarea>
            </div>

            <div class="bg-surface-container-low rounded-xl p-8">
              <label class="block text-sm font-semibold mb-4">${t('jobDescription')}</label>
              <textarea name="job_description" class="w-full h-64 bg-surface-container-lowest rounded-lg border-none focus:ring-2 focus:ring-primary/20 p-4 resize-none" placeholder="${t('jobPlaceholder')}"></textarea>
            </div>
          </div>

          <div class="lg:col-span-5 space-y-8">
            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
              <h3 class="text-base font-bold mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-primary">target</span>${t('targetRole')}</h3>
              <input name="target_role" class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20" placeholder="${t('targetPlaceholder')}" />
            </div>

            <div class="bg-primary/5 rounded-xl p-8 border border-primary/10">
              <h4 class="text-sm font-bold text-primary mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-sm">auto_awesome</span>${t('preview')}</h4>
              <p class="text-xs text-on-surface-variant leading-relaxed">${t('previewSub')}</p>
            </div>

            <button ${state.loading ? 'disabled' : ''} class="w-full bg-gradient-to-br from-primary to-primary-container text-white py-5 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 disabled:opacity-50">
              ${state.loading ? t('running') : t('run')}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  function resultPage() {
    if (!state.result) {
      return `
        <div class="bg-surface-container-lowest rounded-xl p-10 text-center">
          <h2 class="text-2xl font-bold mb-2">${t('noResult')}</h2>
          <p class="text-on-surface-variant mb-6">${t('runFirst')}</p>
          <button id="go-match" class="px-6 py-3 bg-primary text-white rounded-lg font-semibold">${t('goMatch')}</button>
        </div>
      `;
    }

    const r = state.result;
    const circ = Math.round(553 - (Math.max(0, Math.min(100, r.weightedMatchScore || 0)) / 100) * 553);

    return `
      <div class="space-y-8">
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
            <div class="space-y-4 max-w-xl">
              <span class="inline-block px-3 py-1 bg-primary-fixed text-on-primary-fixed text-xs font-bold rounded-full uppercase tracking-widest">${t('navResult')}</span>
              <h2 class="text-4xl font-extrabold leading-tight">${t('heroTitle')}</h2>
              <p class="text-on-surface-variant">${r.synthesizedSummary || ''}</p>
              <a href="/api/v1/analyses/${r.analysisId}/report" target="_blank" class="inline-block px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-lg">${t('download')}</a>
            </div>
            <div class="relative mt-8 md:mt-0">
              <svg class="w-48 h-48 transform -rotate-90">
                <circle class="text-surface-container-highest/40" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" stroke-width="12"></circle>
                <circle class="text-primary" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" stroke-dasharray="553" stroke-dashoffset="${circ}" stroke-linecap="round" stroke-width="12"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-5xl font-black">${r.weightedMatchScore || 0}%</span>
                <span class="text-sm font-bold text-on-surface-variant uppercase tracking-tighter">${t('weighted')}</span>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-primary to-primary-container p-8 rounded-xl text-white flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-lg flex items-center gap-2 mb-3"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">auto_awesome</span>${t('aiInsight')}</h3>
              <p class="text-primary-fixed">Provider: ${(r.llm && r.llm.provider) || 'none'} | Model: ${(r.llm && r.llm.model) || 'none'}</p>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div class="lg:col-span-3 bg-surface-container-low p-8 rounded-xl space-y-5">
            <div class="flex justify-between items-end"><h3 class="text-xl font-bold">${t('skillViz')}</h3><span class="text-xs font-bold text-on-surface-variant">DETAIL</span></div>
            ${(r.skillBreakdown || []).slice(0, 6).map((item) => {
              const val = item.presentInResume ? Math.round((item.weight || 1) * 100) : 20;
              return `
                <div class="space-y-2">
                  <div class="flex justify-between text-sm font-semibold"><span>${item.skill}</span><span class="${scoreColor(val)}">${item.presentInResume ? 'present' : 'gap'}</span></div>
                  <div class="h-3 bg-surface-container-highest/40 rounded-full overflow-hidden"><div class="h-full ${progressColor(val)} rounded-full" style="width:${val}%"></div></div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl space-y-4 shadow-sm">
            <h3 class="text-xl font-bold flex items-center gap-2"><span class="material-symbols-outlined text-tertiary-container">warning</span>${t('gaps')}</h3>
            ${(r.missingSkills || []).length
              ? (r.missingSkills || []).map((skill) => `<div class="p-4 bg-surface-container-low rounded-lg border-l-4 border-tertiary-container"><h4 class="font-bold text-sm">${skill}</h4></div>`).join('')
              : `<p class="text-sm text-on-surface-variant">${t('noGaps')}</p>`}
          </div>
        </section>

        <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h3 class="text-xl font-bold mb-6">${t('studyPlan')}</h3>
            <div class="space-y-4">
              ${(r.studyPlan || []).map((week) => `<div class="p-4 bg-surface-container-low rounded-lg"><h4 class="text-sm font-bold">Week ${week.week}: ${week.focus}</h4><p class="text-xs text-on-surface-variant mt-1">${(week.actions || []).slice(0,1).join('')}</p></div>`).join('')}
            </div>
          </div>
          <div class="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h3 class="text-xl font-bold mb-6">${t('suggestions')}</h3>
            <ul class="space-y-3">
              ${(r.resumeOptimizationSuggestions || []).map((item) => `<li class="flex gap-3"><span class="material-symbols-outlined text-primary">check_circle</span><span class="text-sm">${item}</span></li>`).join('')}
            </ul>
          </div>
        </section>
      </div>
    `;
  }

  function historyPage() {
    const rows = state.history
      .map((item) => {
        const date = new Date(item.createdAt).toLocaleDateString();
        return `
          <button data-open="${item.analysisId}" class="w-full flex flex-col md:flex-row items-center justify-between p-6 bg-surface-container-lowest rounded-xl hover:bg-surface-container-low transition-all text-left">
            <div class="flex items-center gap-5 w-full md:w-auto">
              <div class="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-primary"><span class="material-symbols-outlined">description</span></div>
              <div><h3 class="font-semibold leading-tight">${item.targetRole || 'Untitled Analysis'}</h3><p class="text-sm text-on-surface-variant/70 mt-0.5">${item.analysisId}</p></div>
            </div>
            <div class="flex items-center justify-between w-full md:w-auto mt-4 md:mt-0 gap-10">
              <div class="text-right"><span class="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1">Weighted</span><span class="text-xl font-bold ${scoreColor(item.weightedMatchScore || 0)}">${item.weightedMatchScore || 0}%</span></div>
              <div class="text-right"><span class="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1">Date</span><span class="text-sm font-medium">${date}</span></div>
            </div>
          </button>
        `;
      })
      .join('');

    return `
      <div class="space-y-8">
        <header>
          <h1 class="text-[2.75rem] font-semibold tracking-tight leading-tight mb-2">${t('historyTitle')}</h1>
          <p class="text-on-surface-variant text-lg max-w-2xl leading-relaxed">${t('historySub')}</p>
        </header>

        ${state.error ? `<div class="bg-error-container text-on-error-container rounded-xl p-4 font-medium">${state.error}</div>` : ''}

        <div class="space-y-4">${rows || `<div class="bg-surface-container-lowest rounded-xl p-8 text-on-surface-variant">${t('noHistory')}</div>`}</div>
      </div>
    `;
  }

  function bindActions() {
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
    }

    document.querySelectorAll('[data-open]').forEach((node) => {
      node.addEventListener('click', () => openAnalysis(node.getAttribute('data-open')));
    });

    const newAnalysis = document.getElementById('new-analysis');
    if (newAnalysis) newAnalysis.addEventListener('click', () => setPage('match'));

    const goMatch = document.getElementById('go-match');
    if (goMatch) goMatch.addEventListener('click', () => setPage('match'));

    const translateBtn = document.getElementById('translate-btn');
    if (translateBtn && !translateBtn.dataset.bound) {
      translateBtn.dataset.bound = '1';
      translateBtn.addEventListener('click', toggleLang);
    }
  }

  function render() {
    if (state.page === 'match') app.innerHTML = matchPage();
    if (state.page === 'result') app.innerHTML = resultPage();
    if (state.page === 'history') app.innerHTML = historyPage();
    syncTopNavText();
    bindActions();
  }

  render();
})();

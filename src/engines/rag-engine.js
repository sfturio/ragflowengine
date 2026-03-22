const { normalizeText, clampScore, detectLanguage, extractKeywords } = require("../utils/text-utils");

const SKILL_PATTERNS = {
  "c#": [/(\b|^)c#(\b|$)/i, /\bcsharp\b/i],
  ".net": [/\b\.net\b/i, /\bdotnet\b/i, /\basp\.net\b/i],
  "asp.net core": [/\basp\.net core\b/i, /\baspnet core\b/i],
  "entity framework": [/\bentity framework\b/i, /\bef core\b/i],
  sql: [/\bsql\b/i],
  postgresql: [/\bpostgresql\b/i, /\bpostgres\b/i],
  python: [/\bpython\b/i],
  fastapi: [/\bfastapi\b/i],
  docker: [/\bdocker\b/i],
  kubernetes: [/\bkubernetes\b/i, /\bk8s\b/i],
  aws: [/\baws\b/i, /\bamazon web services\b/i],
  azure: [/\bazure\b/i],
  "github actions": [/\bgithub actions\b/i],
  "ci/cd": [/\bci\/cd\b/i, /\bcontinuous integration\b/i],
  "rest api": [/\brest api\b/i, /\bapi rest\b/i],
  microservices: [/\bmicroservices\b/i],
  redis: [/\bredis\b/i],
  rag: [/\brag\b/i, /\bretrieval augmented generation\b/i],
  nlp: [/\bnlp\b/i]
};

const SECTION_WEIGHTS = {
  requisitos: { normalized: "requisitos", weight: 1.0 },
  requirements: { normalized: "requisitos", weight: 1.0 },
  responsibility: { normalized: "atribuicoes", weight: 0.85 },
  responsibilities: { normalized: "atribuicoes", weight: 0.85 },
  responsabilidades: { normalized: "atribuicoes", weight: 0.85 },
  atribuicoes: { normalized: "atribuicoes", weight: 0.85 },
  diferenciais: { normalized: "diferenciais", weight: 0.55 },
  "nice to have": { normalized: "diferenciais", weight: 0.55 }
};

const ROLE_HINT_SKILLS = [
  {
    patterns: [/\bbackend developer\b/i, /\bbackend engineer\b/i, /\bdesenvolvedor backend\b/i, /\bengenheiro backend\b/i],
    skills: ["rest api", "sql", "docker", "ci/cd"]
  },
  {
    patterns: [/\bfull[- ]?stack developer\b/i, /\bfull[- ]?stack engineer\b/i, /\bdesenvolvedor full[- ]?stack\b/i],
    skills: ["rest api", "sql", "docker", "github actions"]
  },
  {
    patterns: [/\bdevops engineer\b/i, /\bengenheiro devops\b/i],
    skills: ["docker", "kubernetes", "aws", "ci/cd"]
  }
];

const GENERIC_KEYWORD_BLOCKLIST = new Set([
  "backend",
  "developer",
  "engineer",
  "software",
  "senior",
  "junior",
  "pleno",
  "vaga",
  "role",
  "team",
  "experience",
  "anos",
  "years",
  "empresa",
  "company",
  "projeto",
  "project",
  "remote",
  "remoto",
  "hibrido",
  "hybrid",
  "fulltime",
  "tempo",
  "integral"
]);

const RESOURCES_BY_SKILL = {
  ".net": ["Microsoft Learn - .NET", ".NET documentation"],
  "asp.net core": ["ASP.NET Core docs", "Minimal APIs and MVC tutorials"],
  "entity framework": ["EF Core docs", "EF Core in Action"],
  aws: ["AWS Skill Builder", "AWS Well-Architected Framework"],
  azure: ["Microsoft Learn - Azure", "Azure Architecture Center"],
  docker: ["Docker Docs", "Play with Docker"],
  kubernetes: ["Kubernetes Docs", "Kubernetes Basics"],
  "ci/cd": ["GitHub Actions Docs", "CI/CD Best Practices"],
  rag: ["Pinecone Learn - RAG", "OpenAI cookbook (RAG patterns)"]
};

const I18N = {
  en: {
    mentionFound: "Mention found for",
    noEvidence: "No relevant evidence found.",
    reportTitle: "Career Fit Report",
    matchScore: "Match score",
    weightedMatchScore: "Weighted match score",
    matchedSkills: "Matched skills",
    missingSkills: "Missing skills",
    matchedSkillsSection: "## Matched skills",
    missingSkillsSection: "## Missing skills",
    evidenceSection: "## Evidence (RAG-like retrieval)",
    studyPlanSection: "## Study plan",
    nextActionsSection: "## Next steps to improve your Match",
    weekLabel: "Week",
    none: "None",
    fallbackFocus: "Portfolio and interview readiness",
    fallbackA1: "Prepare two concise case studies with measurable outcomes.",
    fallbackA2: "Rehearse STAR-based answers for technical interviews.",
    summary1: "Rewrite your summary to align with",
    summary2: " outcomes.",
    sProjects: "Add projects with measurable impact and business context.",
    sStack: "Organize the technical stack by category (languages, cloud, data, testing).",
    sMissing: "Prioritize missing competencies",
    w1: "Critical gap baseline",
    w2: "Hands-on project with",
    w3: "Quality and integration with",
    w4: "Resume and interview packaging",
    w1a1: "Review core concepts and practical patterns for",
    w1a2: "Complete two exercises directly using",
    w1a3: "Document learnings in a public GitHub note.",
    w2a1: "Build a small backend feature combining",
    w2a2: "Write architecture notes and tradeoff decisions.",
    w2a3: "Publish a short demo and project summary.",
    w3a1: "Add testing and validation around the feature.",
    w3a2: "Integrate with a realistic backend flow that uses",
    w3a3: "Track quality indicators (errors, latency, test pass rate).",
    w4a1: "Update resume with concrete outcomes linked to",
    w4a2: "Prepare five interview stories using STAR format.",
    w4a3: "Apply to target roles and track recruiter feedback.",
    highMatch: "Strong on your resume",
    mediumMatch: "Can be strengthened",
    lowMatch: "Needs development"
  },
  pt: {
    mentionFound: "Mencao encontrada para",
    noEvidence: "Nenhuma evidencia relevante encontrada.",
    reportTitle: "Relatorio de Aderencia",
    matchScore: "Match score",
    weightedMatchScore: "Match score ponderado",
    matchedSkills: "Skills fortes no curriculo",
    missingSkills: "Skills para desenvolver",
    matchedSkillsSection: "## Skills fortes no curriculo",
    missingSkillsSection: "## Skills para desenvolver",
    evidenceSection: "## Evidencias (RAG)",
    studyPlanSection: "## Roadmap de carreira personalizado",
    nextActionsSection: "## Proximos passos para aumentar seu Match",
    weekLabel: "Semana",
    none: "Nenhum",
    fallbackFocus: "Consolidacao de posicionamento tecnico",
    fallbackA1: "Organize dois cases com problema, solucao, stack e resultado mensuravel.",
    fallbackA2: "Treine narrativa STAR para entrevistas tecnicas e comportamentais.",
    summary1: "Reescreva seu resumo para alinhar com resultados de",
    summary2: ".",
    sProjects: "Adicione projetos com impacto mensuravel e contexto de negocio.",
    sStack: "Organize a stack tecnica por categoria (linguagens, cloud, dados, testes).",
    sMissing: "Priorize competencias ausentes",
    w1: "Base da lacuna critica",
    w2: "Projeto pratico com",
    w3: "Qualidade e integracao com",
    w4: "Curriculo e preparo para entrevistas",
    w1a1: "Revise conceitos centrais e padroes praticos de",
    w1a2: "Conclua dois exercicios focados em",
    w1a3: "Documente aprendizados no GitHub.",
    w2a1: "Construa uma feature backend combinando",
    w2a2: "Escreva notas de arquitetura e trade-offs.",
    w2a3: "Publique uma demo curta com resumo tecnico.",
    w3a1: "Adicione testes e validacoes ao fluxo principal.",
    w3a2: "Integre com um fluxo backend real usando",
    w3a3: "Acompanhe indicadores (erros, latencia, taxa de sucesso).",
    w4a1: "Atualize o curriculo com resultados concretos ligados a",
    w4a2: "Prepare cinco historias de entrevista usando STAR.",
    w4a3: "Aplique para vagas-alvo e acompanhe feedbacks.",
    highMatch: "Forte no seu curriculo",
    mediumMatch: "Pode fortalecer",
    lowMatch: "Precisa desenvolver"
  }
};

function t(language, key) {
  return (I18N[language] || I18N.en)[key] || I18N.en[key] || key;
}

function hasSkill(text, skill) {
  const patterns = SKILL_PATTERNS[skill] || [new RegExp(`\\b${skill}\\b`, "i")];
  return patterns.some((pattern) => pattern.test(text));
}

function extractSkills(text = "") {
  const normalized = normalizeText(text);
  return Object.keys(SKILL_PATTERNS).filter((skill) => hasSkill(normalized, skill));
}

function extractRoleHintSkills(jobDescription = "", targetRole = "") {
  const source = `${jobDescription}\n${targetRole}`.trim();
  if (!source) return [];

  const found = new Set();
  for (const hint of ROLE_HINT_SKILLS) {
    if (hint.patterns.some((pattern) => pattern.test(source))) {
      for (const skill of hint.skills) found.add(skill);
    }
  }
  return [...found];
}

function extractKeywordFallbackSkills(jobDescription = "", targetRole = "") {
  const raw = extractKeywords(`${jobDescription}\n${targetRole}`, 30);
  return raw
    .filter((token) => token.length >= 3)
    .filter((token) => !GENERIC_KEYWORD_BLOCKLIST.has(token))
    .slice(0, 10);
}

function extractOverlapSkills(jobDescription = "", resumeText = "", targetRole = "") {
  const jobKeywords = new Set(extractKeywordFallbackSkills(jobDescription, targetRole));
  const resumeKeywords = new Set(extractKeywords(resumeText, 80));
  const overlap = [];

  for (const token of jobKeywords) {
    if (resumeKeywords.has(token)) overlap.push(token);
  }

  return overlap.slice(0, 8);
}

function chooseOutputLanguage({ resumeText = "", jobDescription = "", targetRole = "" }) {
  const detected = detectLanguage(resumeText, jobDescription, targetRole);
  if (detected !== "en") return "pt";

  const source = normalizeText(`${jobDescription} ${targetRole}`);
  const englishSignals = [
    "backend developer",
    "backend engineer",
    "requirements",
    "responsibilities",
    "nice to have",
    "must have",
    "full stack",
    "cloud",
    "microservices"
  ];
  const enHits = englishSignals.filter((signal) => source.includes(signal)).length;
  return enHits >= 2 ? "en" : "pt";
}

function extractWeightedJobSkills(jobDescription = "", targetRole = "") {
  const lines = jobDescription.split("\n").map((line) => line.trim()).filter(Boolean);
  const weighted = new Map();
  let sectionName = "geral";
  let sectionWeight = 0.75;

  for (const line of lines) {
    const normalized = normalizeText(line);
    for (const [sectionKey, data] of Object.entries(SECTION_WEIGHTS)) {
      if (normalized.includes(sectionKey)) {
        sectionName = data.normalized;
        sectionWeight = data.weight;
      }
    }

    const lineSkills = extractSkills(line);
    for (const skill of lineSkills) {
      const current = weighted.get(skill);
      if (!current || sectionWeight > current.weight) {
        weighted.set(skill, { weight: sectionWeight, section: sectionName });
      }
    }
  }

  if (!weighted.size) {
    for (const skill of extractSkills(jobDescription).slice(0, 8)) {
      weighted.set(skill, { weight: 1.0, section: "geral" });
    }
  }

  const roleHintSkills = extractRoleHintSkills(jobDescription, targetRole);
  for (const skill of roleHintSkills) {
    if (!weighted.has(skill)) {
      weighted.set(skill, { weight: 0.65, section: "geral" });
    }
  }

  if (!weighted.size) {
    const keywordSkills = extractKeywordFallbackSkills(jobDescription, targetRole);
    for (const skill of keywordSkills) {
      weighted.set(skill, { weight: 0.6, section: "geral" });
    }
  }

  return [...weighted.entries()].map(([skill, value]) => ({
    skill,
    weight: value.weight,
    sourceSection: value.section
  }));
}

function chunkText(text, chunkSize = 420, overlap = 90) {
  const cleaned = text.replace(/\r\n/g, "\n");
  if (!cleaned.trim()) return [];
  const chunks = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(cleaned.length, start + chunkSize);
    chunks.push(cleaned.slice(start, end).replace(/\s+/g, " ").trim());
    if (end === cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks.filter(Boolean);
}

function tokenSet(text) {
  return new Set((normalizeText(text).match(/[a-z0-9+#.]{2,}/g) || []).slice(0, 250));
}

function jaccardSimilarity(aText, bText) {
  const a = tokenSet(aText);
  const b = tokenSet(bText);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union ? intersection / union : 0;
}

function searchEvidence(resumeText, skill) {
  const chunks = chunkText(resumeText).map((chunk, index) => ({
    chunkId: `c${index + 1}`,
    text: chunk,
    score: jaccardSimilarity(chunk, `${skill} backend project experience`)
  }));

  chunks.sort((a, b) => b.score - a.score);
  const best = chunks.find((item) => hasSkill(normalizeText(item.text), skill)) || chunks[0] || null;
  if (!best) return null;
  return {
    evidence: best.text.length > 220 ? `${best.text.slice(0, 220).trim()}...` : best.text,
    evidenceChunk: best.chunkId,
    evidenceScore: Number(best.score.toFixed(2))
  };
}

function getSkillLevel(score) {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function getSkillLevelLabel(language, level) {
  if (level === "high") return t(language, "highMatch");
  if (level === "medium") return t(language, "mediumMatch");
  return t(language, "lowMatch");
}

function skillImproveSuggestion(language, skill, level) {
  if (level === "high") {
    return language === "pt"
      ? `Aumente senioridade mostrando impacto de ${skill} com escala, latencia, custo ou qualidade.`
      : `Increase seniority by showing ${skill} impact with scale, latency, cost, or quality outcomes.`;
  }
  if (level === "medium") {
    return language === "pt"
      ? `Fortaleca ${skill} com um bullet mais tecnico: tecnologia + decisao + resultado quantificado.`
      : `Strengthen ${skill} with a technical bullet: technology + decision + quantified result.`;
  }
  return language === "pt"
    ? `Inclua uma experiencia pratica com ${skill} em projeto real e destaque no curriculo com resultado mensuravel.`
    : `Add practical ${skill} experience in a real project and highlight measurable outcomes on your resume.`;
}

function buildSkillBreakdown(requiredSkills, resumeText, language) {
  const normalizedResume = normalizeText(resumeText);
  return requiredSkills.map((item) => {
    const present = hasSkill(normalizedResume, item.skill);
    const evidence = present ? searchEvidence(resumeText, item.skill) : null;
    const relevanceBoost = clampScore((item.weight || 0) * 100) / 100;
    const evidenceBoost = evidence ? Math.round((evidence.evidenceScore || 0) * 20) : 0;
    const score = clampScore((present ? 55 : 15) + Math.round(relevanceBoost * 35) + evidenceBoost);
    const level = getSkillLevel(score);
    const levelLabel = getSkillLevelLabel(language, level);
    const explanation = present
      ? language === "pt"
        ? `A skill ${item.skill} foi detectada no curriculo e conectada ao contexto da vaga (peso ${Math.round(
            (item.weight || 0) * 100
          )}%).`
        : `The skill ${item.skill} was detected in the resume and linked to job context (weight ${Math.round(
            (item.weight || 0) * 100
          )}%).`
      : language === "pt"
      ? `A skill ${item.skill} aparece como relevante na vaga, mas nao foi evidenciada no curriculo.`
      : `The skill ${item.skill} is relevant for the role but was not evidenced in the resume.`;

    return {
      skill: item.skill,
      score,
      level,
      levelLabel,
      explanation,
      evidenceSnippet: evidence ? evidence.evidence : null,
      improveSuggestion: skillImproveSuggestion(language, item.skill, level),
      presentInResume: present,
      weight: item.weight,
      sourceSection: item.sourceSection,
      evidence: evidence ? evidence.evidence : present ? `${t(language, "mentionFound")} ${item.skill}.` : null,
      evidenceChunk: evidence ? evidence.evidenceChunk : null,
      evidenceScore: evidence ? evidence.evidenceScore : null
    };
  });
}

function buildWeekDeliverable(language, skills, week) {
  const combo = skills.join(language === "pt" ? " + " : " + ");
  if (week === 1) {
    return language === "pt"
      ? "Repositorio GitHub com README tecnico e checklist de aprendizado."
      : "GitHub repository with technical README and learning checklist.";
  }
  if (week <= 3) {
    return language === "pt"
      ? `Feature funcional envolvendo ${combo} com endpoint ou demo publicada.`
      : `Working feature using ${combo} with a published endpoint or demo.`;
  }
  return language === "pt"
    ? `Atualizacao do curriculo + portfolio com resultados mensuraveis das entregas em ${combo}.`
    : `Updated resume + portfolio with measurable outcomes from ${combo} deliverables.`;
}

function buildCareerRoadmap(prioritizedMissing, matchedSkills, language) {
  const gaps = prioritizedMissing.map((item) => item.skill);
  const baseSkills = gaps.length ? gaps : matchedSkills.slice(0, 3);
  const uniqueSkills = [...new Set(baseSkills)].slice(0, 6);
  const weeksCount = Math.min(6, Math.max(3, 3 + Math.ceil(uniqueSkills.length / 2)));
  const fallbackSkill = uniqueSkills[0] || "backend";

  const roadmap = [];
  for (let week = 1; week <= weeksCount; week += 1) {
    const primary = uniqueSkills[(week - 1) % Math.max(uniqueSkills.length, 1)] || fallbackSkill;
    const secondary =
      uniqueSkills[week % Math.max(uniqueSkills.length, 1)] || uniqueSkills[0] || fallbackSkill;
    const skillsThisWeek = week === 1 ? [primary] : [primary, secondary];
    const resources = [...new Set(skillsThisWeek.flatMap((skill) => RESOURCES_BY_SKILL[skill] || [`Official docs for ${skill}`]))].slice(0, 4);

    roadmap.push({
      week,
      title:
        language === "pt"
          ? `Fortalecer ${skillsThisWeek.join(" + ")}`
          : `Strengthen ${skillsThisWeek.join(" + ")}`,
      focusObjective:
        language === "pt"
          ? `Construir dominio pratico de ${skillsThisWeek.join(
              " e "
            )} no contexto de uma vaga real.`
          : `Build practical command of ${skillsThisWeek.join(" and ")} in a real-job context.`,
      practicalTask:
        language === "pt"
          ? `Implementar uma entrega real usando ${skillsThisWeek.join(
              " e "
            )}: API, automacao ou integracao orientada a negocio.`
          : `Implement a real deliverable with ${skillsThisWeek.join(
              " and "
            )}: API, automation, or business-oriented integration.`,
      deliverable: buildWeekDeliverable(language, skillsThisWeek, week),
      careerImpact:
        language === "pt"
          ? `Mostra aos recrutadores evidencia concreta de ${skillsThisWeek.join(
              " e "
            )}, elevando a percepcao de prontidao para a vaga.`
          : `Shows recruiters concrete evidence of ${skillsThisWeek.join(
              " and "
            )}, improving readiness perception for the role.`,
      relatedSkills: skillsThisWeek,
      resources
    });
  }

  return roadmap;
}

function buildCareerNextActions({
  language,
  targetRole,
  weightedMatchScore,
  prioritizedMissing,
  skillBreakdown
}) {
  const role = targetRole || (language === "pt" ? "vaga alvo" : "target role");
  const actions = [];
  const topGaps = prioritizedMissing.slice(0, 4).map((item) => item.skill);
  const weakSignals = skillBreakdown.filter((item) => item.level !== "high").slice(0, 3);

  if (topGaps.length) {
    actions.push({
      category: "Skills",
      icon: "🧠",
      title: `Evidenciar ${topGaps.slice(0, 2).join(" e ")} com provas praticas`,
      whyMatch:
        language === "pt"
          ? `Essas competencias aparecem como gap prioritario e reduzem seu match atual (${weightedMatchScore}%).`
          : `These skills are top gaps and reduce your current match (${weightedMatchScore}%).`,
      execution:
        language === "pt"
          ? `Atualize projetos e experiencias com bullets tecnicos para ${topGaps.join(
              ", "
            )}, incluindo tecnologia usada e resultado.`
          : `Update projects and experience bullets for ${topGaps.join(
              ", "
            )}, including stack and measurable outcomes.`,
      recruiterGain:
        language === "pt"
          ? "Aumenta a leitura de aderencia tecnica imediata no primeiro scan do curriculo."
          : "Improves immediate technical-fit perception during first resume scan."
    });
  }

  actions.push({
    category: "Match",
    icon: "🎯",
    title: "Alinhar resumo profissional com requisitos da vaga",
    whyMatch:
      language === "pt"
        ? `Seu posicionamento atual nao comunica claramente por que voce e forte para ${role}.`
        : `Your current positioning does not clearly communicate why you are strong for ${role}.`,
    execution:
      language === "pt"
        ? `Reescreva o resumo em 3-4 linhas: stack principal, tipo de problema resolvido e impacto entregue.`
        : `Rewrite summary in 3-4 lines: core stack, problem domain, and delivered impact.`,
    recruiterGain:
      language === "pt"
        ? "Gera narrativa mais senior e facilita shortlist rapido."
        : "Creates a more senior narrative and supports faster shortlisting."
  });

  if (weakSignals.length) {
    actions.push({
      category: "Career",
      icon: "🚀",
      title: "Transformar bullets vagos em resultados quantificados",
      whyMatch:
        language === "pt"
          ? "Responsabilidades genericas nao sustentam score de match nem senioridade percebida."
          : "Generic responsibilities do not support match score or perceived seniority.",
      execution:
        language === "pt"
          ? `Escolha 3 experiencias e reescreva no formato Acao + Contexto + Resultado (%/tempo/custo), cobrindo ${weakSignals
              .map((item) => item.skill)
              .join(", ")}.`
          : `Pick 3 experiences and rewrite as Action + Context + Result (%/time/cost), covering ${weakSignals
              .map((item) => item.skill)
              .join(", ")}.`,
      recruiterGain:
        language === "pt"
          ? "Aumenta credibilidade tecnica e percepcao de ownership."
          : "Increases technical credibility and ownership perception."
    });
  }

  actions.push({
    category: "Study",
    icon: "📚",
    title: "Publicar evidencia tecnica recorrente",
    whyMatch:
      language === "pt"
        ? "Sem prova recente de evolucao, gaps continuam sendo interpretados como risco."
        : "Without recent proof of progress, gaps keep being interpreted as risk.",
    execution:
      language === "pt"
        ? "Publique semanalmente um micro-case no GitHub/LinkedIn com problema, implementacao e resultado."
        : "Publish a weekly micro-case on GitHub/LinkedIn with problem, implementation, and outcome.",
    recruiterGain:
      language === "pt"
        ? "Passa sinal de aprendizado continuo e prontidao de mercado."
        : "Signals continuous learning and market readiness."
  });

  return actions.slice(0, 8);
}

function buildReport({
  language,
  targetRole,
  matchScore,
  weightedMatchScore,
  matchedSkills,
  missingSkills,
  skillBreakdown,
  studyPlan,
  nextActions
}) {
  const lines = [
    `# ${t(language, "reportTitle")} - ${targetRole || "Backend Developer"}`,
    "",
    `- ${t(language, "matchScore")}: **${matchScore}%**`,
    `- ${t(language, "weightedMatchScore")}: **${weightedMatchScore}%**`,
    `- ${t(language, "matchedSkills")}: **${matchedSkills.length}**`,
    `- ${t(language, "missingSkills")}: **${missingSkills.length}**`,
    "",
    t(language, "matchedSkillsSection"),
    ...(matchedSkills.length ? matchedSkills.map((skill) => `- ${skill}`) : [`- ${t(language, "none")}`]),
    "",
    t(language, "missingSkillsSection"),
    ...(missingSkills.length ? missingSkills.map((skill) => `- ${skill}`) : [`- ${t(language, "none")}`]),
    "",
    t(language, "evidenceSection")
  ];

  const evidenceItems = skillBreakdown.filter((item) => item.presentInResume && item.evidence);
  for (const item of evidenceItems.slice(0, 10)) {
    const meta = [];
    if (item.evidenceChunk) meta.push(`chunk ${item.evidenceChunk}`);
    if (item.evidenceScore !== null && item.evidenceScore !== undefined) meta.push(`score ${item.evidenceScore}`);
    lines.push(`- ${item.skill}${meta.length ? ` (${meta.join(" | ")})` : ""}: ${item.evidence}`);
  }
  if (!evidenceItems.length) lines.push(`- ${t(language, "noEvidence")}`);

  lines.push("", t(language, "studyPlanSection"));
  for (const week of studyPlan) {
    lines.push(`### ${t(language, "weekLabel")} ${week.week} - ${week.title || week.focus}`);
    if (week.focusObjective) lines.push(`- Objetivo: ${week.focusObjective}`);
    if (week.practicalTask) lines.push(`- Tarefa pratica: ${week.practicalTask}`);
    if (week.deliverable) lines.push(`- Entregavel: ${week.deliverable}`);
    if (week.careerImpact) lines.push(`- Impacto de carreira: ${week.careerImpact}`);
    for (const action of week.actions || []) lines.push(`- ${action}`);
  }

  lines.push("", t(language, "nextActionsSection"));
  for (const action of nextActions || []) {
    lines.push(`- ${action.icon || "•"} ${action.title}`);
    lines.push(`  - Por que aumenta match: ${action.whyMatch}`);
    lines.push(`  - Como executar: ${action.execution}`);
    lines.push(`  - Ganho de percepcao: ${action.recruiterGain}`);
  }

  return lines.join("\n");
}

function analyzeResumeVsJob({ resumeText, jobDescription, targetRole }) {
  const language = chooseOutputLanguage({ resumeText, jobDescription, targetRole });

  const requiredSkills = extractWeightedJobSkills(jobDescription, targetRole);
  const overlapSkills = extractOverlapSkills(jobDescription, resumeText, targetRole);
  for (const skill of overlapSkills) {
    if (!requiredSkills.some((item) => item.skill === skill)) {
      requiredSkills.push({ skill, weight: 0.5, sourceSection: "geral" });
    }
  }

  if (!requiredSkills.length) {
    const resumeFallback = extractKeywords(resumeText, 10).filter((token) => !GENERIC_KEYWORD_BLOCKLIST.has(token));
    for (const skill of resumeFallback) {
      requiredSkills.push({ skill, weight: 0.35, sourceSection: "geral" });
    }
  }
  const skillBreakdown = buildSkillBreakdown(requiredSkills, resumeText, language);
  const matchedSkills = skillBreakdown.filter((item) => item.presentInResume).map((item) => item.skill);
  const missingSkills = skillBreakdown.filter((item) => !item.presentInResume).map((item) => item.skill);
  const matchScore = requiredSkills.length ? clampScore((matchedSkills.length / requiredSkills.length) * 100) : 0;
  const totalWeight = requiredSkills.reduce((sum, item) => sum + item.weight, 0) || 1;
  const matchedWeight = skillBreakdown.filter((item) => item.presentInResume).reduce((sum, item) => sum + item.weight, 0);
  const weightedMatchScore = clampScore((matchedWeight / totalWeight) * 100);

  const prioritizedMissing = skillBreakdown
    .filter((item) => !item.presentInResume)
    .sort((a, b) => b.weight - a.weight)
    .map((item) => ({ skill: item.skill, weight: item.weight, section: item.sourceSection }));

  const studyPlan = buildCareerRoadmap(prioritizedMissing, matchedSkills, language);
  const nextActions = buildCareerNextActions({
    language,
    targetRole,
    weightedMatchScore,
    prioritizedMissing,
    skillBreakdown
  });
  const suggestions = nextActions.map((item) => item.title);
  const reportMarkdown = buildReport({
    language,
    targetRole,
    matchScore,
    weightedMatchScore,
    matchedSkills,
    missingSkills,
    skillBreakdown,
    studyPlan,
    nextActions
  });

  return {
    matchScore,
    weightedMatchScore,
    matchedSkills,
    missingSkills,
    skillBreakdown,
    nextActions,
    careerRoadmap: studyPlan,
    studyPlan,
    resumeOptimizationSuggestions: suggestions,
    reportMarkdown,
    metadata: { language }
  };
}

module.exports = { analyzeResumeVsJob };

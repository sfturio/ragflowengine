const { normalizeText, clampScore, detectLanguage } = require("../utils/text-utils");

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
  responsabilidades: { normalized: "atribuicoes", weight: 0.85 },
  atribuicoes: { normalized: "atribuicoes", weight: 0.85 },
  diferenciais: { normalized: "diferenciais", weight: 0.55 },
  "nice to have": { normalized: "diferenciais", weight: 0.55 }
};

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
    w4a3: "Apply to target roles and track recruiter feedback."
  },
  pt: {
    mentionFound: "Mencao encontrada para",
    noEvidence: "Nenhuma evidencia relevante encontrada.",
    reportTitle: "Relatorio de Aderencia",
    matchScore: "Match score",
    weightedMatchScore: "Match score ponderado",
    matchedSkills: "Skills com aderencia",
    missingSkills: "Skills ausentes",
    matchedSkillsSection: "## Skills com aderencia",
    missingSkillsSection: "## Gaps de skills",
    evidenceSection: "## Evidencias (RAG)",
    studyPlanSection: "## Plano de estudo",
    weekLabel: "Semana",
    none: "Nenhum",
    fallbackFocus: "Refino de portfolio e entrevistas",
    fallbackA1: "Prepare dois estudos de caso curtos com resultados mensuraveis.",
    fallbackA2: "Treine respostas STAR para entrevistas tecnicas.",
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
    w4a3: "Aplique para vagas-alvo e acompanhe feedbacks."
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

function extractWeightedJobSkills(jobDescription = "") {
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

function buildSkillBreakdown(requiredSkills, resumeText, language) {
  const normalizedResume = normalizeText(resumeText);
  return requiredSkills.map((item) => {
    const present = hasSkill(normalizedResume, item.skill);
    const evidence = present ? searchEvidence(resumeText, item.skill) : null;

    return {
      skill: item.skill,
      presentInResume: present,
      weight: item.weight,
      sourceSection: item.sourceSection,
      evidence: evidence ? evidence.evidence : present ? `${t(language, "mentionFound")} ${item.skill}.` : null,
      evidenceChunk: evidence ? evidence.evidenceChunk : null,
      evidenceScore: evidence ? evidence.evidenceScore : null
    };
  });
}

function buildStudyPlan(prioritizedMissing, language) {
  if (!prioritizedMissing.length) {
    return [
      {
        week: 1,
        focus: t(language, "fallbackFocus"),
        actions: [t(language, "fallbackA1"), t(language, "fallbackA2")],
        resources: ["STAR Method Guide", "Pramp"]
      }
    ];
  }

  const top = prioritizedMissing.map((item) => item.skill).slice(0, 3);
  const [s1, s2 = top[0], s3 = s2] = top;

  const resourcesFor = (skills) => {
    const resources = [];
    for (const skill of skills) {
      resources.push(...(RESOURCES_BY_SKILL[skill] || [`Official docs for ${skill}`]));
    }
    return [...new Set(resources)].slice(0, 4);
  };

  return [
    {
      week: 1,
      focus: `${t(language, "w1")}: ${s1}`,
      actions: [
        `${t(language, "w1a1")} ${s1}.`,
        `${t(language, "w1a2")} ${s1}.`,
        t(language, "w1a3")
      ],
      resources: resourcesFor([s1])
    },
    {
      week: 2,
      focus: `${t(language, "w2")} ${s1} ${language === "pt" ? "e" : "and"} ${s2}`,
      actions: [
        `${t(language, "w2a1")} ${s1} ${language === "pt" ? "e" : "and"} ${s2}.`,
        t(language, "w2a2"),
        t(language, "w2a3")
      ],
      resources: resourcesFor([s1, s2])
    },
    {
      week: 3,
      focus: `${t(language, "w3")} ${s2}/${s3}`,
      actions: [
        t(language, "w3a1"),
        `${t(language, "w3a2")} ${s3}.`,
        t(language, "w3a3")
      ],
      resources: resourcesFor([s2, s3])
    },
    {
      week: 4,
      focus: t(language, "w4"),
      actions: [
        `${t(language, "w4a1")} ${s1} ${language === "pt" ? "e" : "and"} ${s2}.`,
        t(language, "w4a2"),
        t(language, "w4a3")
      ],
      resources: ["LinkedIn Jobs", "STAR Method Guide", "GitHub"]
    }
  ];
}

function buildDeterministicSuggestions(targetRole, missingSkills, language) {
  const role = targetRole || (language === "pt" ? "o cargo alvo" : "the target role");
  const base = [
    `${t(language, "summary1")} ${role}${t(language, "summary2")}`,
    t(language, "sProjects"),
    t(language, "sStack")
  ];
  if (missingSkills.length) {
    base.push(`${t(language, "sMissing")}: ${missingSkills.slice(0, 5).join(", ")}.`);
  }
  return base;
}

function buildReport({
  language,
  targetRole,
  matchScore,
  weightedMatchScore,
  matchedSkills,
  missingSkills,
  skillBreakdown,
  studyPlan
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
    lines.push(`### ${t(language, "weekLabel")} ${week.week} - ${week.focus}`);
    for (const action of week.actions) lines.push(`- ${action}`);
  }

  return lines.join("\n");
}

function analyzeResumeVsJob({ resumeText, jobDescription, targetRole }) {
  const language = detectLanguage(resumeText, jobDescription, targetRole || "");

  const requiredSkills = extractWeightedJobSkills(jobDescription);
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

  const studyPlan = buildStudyPlan(prioritizedMissing, language);
  const suggestions = buildDeterministicSuggestions(targetRole, missingSkills, language);
  const reportMarkdown = buildReport({
    language,
    targetRole,
    matchScore,
    weightedMatchScore,
    matchedSkills,
    missingSkills,
    skillBreakdown,
    studyPlan
  });

  return {
    matchScore,
    weightedMatchScore,
    matchedSkills,
    missingSkills,
    skillBreakdown,
    studyPlan,
    resumeOptimizationSuggestions: suggestions,
    reportMarkdown,
    metadata: { language }
  };
}

module.exports = { analyzeResumeVsJob };

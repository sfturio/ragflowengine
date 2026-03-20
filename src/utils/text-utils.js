const STOPWORDS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "ou",
  "para",
  "por",
  "que",
  "se",
  "sem",
  "the",
  "and",
  "or",
  "to",
  "for",
  "with",
  "in",
  "on",
  "of",
  "is",
  "are",
  "we",
  "our",
  "need",
  "strong"
]);

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text = "") {
  const raw = normalizeText(text).match(/[a-z0-9+#.]{2,}/g) || [];
  return raw
    .map((token) => token.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}

function extractKeywords(jobDescription = "", limit = 40) {
  const tokens = tokenize(jobDescription).filter((token) => !STOPWORDS.has(token));
  const frequency = new Map();
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }
  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

function unique(values = []) {
  return [...new Set(values)];
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function detectLanguage(...chunks) {
  const text = normalizeText(chunks.filter(Boolean).join(" "));
  if (!text) return "en";

  const ptHints = [
    " curriculo ",
    " vaga ",
    " experiencia ",
    " habilidades ",
    " educacao ",
    " descricao ",
    " cargo ",
    " requisitos ",
    "resumo",
    "projetos",
    "objetivo"
  ];

  const enHints = [
    " resume ",
    " job ",
    " experience ",
    " skills ",
    " education ",
    " description ",
    " role ",
    " requirements ",
    "summary",
    "projects",
    "objective"
  ];

  let ptScore = 0;
  let enScore = 0;
  for (const hint of ptHints) if (text.includes(hint.trim()) || text.includes(hint)) ptScore += 1;
  for (const hint of enHints) if (text.includes(hint.trim()) || text.includes(hint)) enScore += 1;
  return ptScore > enScore ? "pt" : "en";
}

module.exports = {
  clampScore,
  detectLanguage,
  extractKeywords,
  normalizeText,
  tokenize,
  unique
};

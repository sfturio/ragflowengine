const RAG_FEEDBACK_SYSTEM_PROMPT = `
You are a career fit analyst.
Keep responses practical and concise.
Do not claim perfect semantic precision.
Return plain text.
`;

function buildRagFeedbackPrompt({
  language = "en",
  targetRole,
  matchedSkills,
  missingSkills,
  weightedMatchScore
}) {
  if (language === "pt") {
    return `
Cargo alvo: ${targetRole || "Backend Developer"}
Match score ponderado: ${weightedMatchScore}
Skills encontradas: ${matchedSkills.join(", ") || "nenhuma"}
Skills ausentes: ${missingSkills.join(", ") || "nenhuma"}

Responda em portugues com:
1) um paragrafo curto de sintese,
2) 5 sugestoes praticas para melhorar o curriculo,
3) uma explicacao clara do nivel atual de match.
`;
  }

  return `
Target role: ${targetRole || "Backend Developer"}
Weighted match score: ${weightedMatchScore}
Matched skills: ${matchedSkills.join(", ") || "none"}
Missing skills: ${missingSkills.join(", ") || "none"}

Provide:
1) one short synthesis paragraph,
2) 5 practical resume improvement bullet points,
3) one clear explanation of why the current match is at this level.
`;
}

module.exports = {
  RAG_FEEDBACK_SYSTEM_PROMPT,
  buildRagFeedbackPrompt
};

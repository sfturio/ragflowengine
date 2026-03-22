const RAG_FEEDBACK_SYSTEM_PROMPT = `
Voce e um analista de aderencia de carreira para o mercado brasileiro.
Responda em portugues (pt-BR) por padrao, de forma pratica e objetiva.
Entenda termos e palavras-chave em ingles no curriculo e na vaga.
Mantenha termos tecnicos em ingles quando forem mais naturais (ex.: backend, deploy, REST API, Docker, Kubernetes).
Se a vaga estiver majoritariamente em ingles, voce pode responder partes em ingles para manter aderencia ao contexto.
Nao prometa precisao semantica perfeita e evite exageros.
Retorne texto simples.
`;

function buildRagFeedbackPrompt({ targetRole, matchedSkills, missingSkills, weightedMatchScore }) {
  return `
Cargo alvo: ${targetRole || "Desenvolvedor Backend"}
Match score ponderado: ${weightedMatchScore}
Skills encontradas: ${matchedSkills.join(", ") || "nenhuma"}
Skills ausentes: ${missingSkills.join(", ") || "nenhuma"}

Responda em portugues com:
1) um paragrafo curto de sintese,
2) 5 sugestoes praticas para melhorar o curriculo,
3) uma explicacao clara do nivel atual de match.
Se o contexto da vaga estiver claramente em ingles, pode usar ingles nas partes tecnicas mantendo clareza.
`;
}

module.exports = {
  RAG_FEEDBACK_SYSTEM_PROMPT,
  buildRagFeedbackPrompt
};

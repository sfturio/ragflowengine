const { analyzeResumeVsJob } = require("../engines/rag-engine");
const {
  getAnalysisById,
  listAnalyses,
  saveAnalysis
} = require("../repositories/analysis-repository");
const { generateText } = require("../lib/llm");
const {
  RAG_FEEDBACK_SYSTEM_PROMPT,
  buildRagFeedbackPrompt
} = require("../prompts/rag-feedback.prompt");

function applyLlmAssist(baseResult, llmText) {
  if (!llmText) return baseResult;
  const lines = llmText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^#{1,6}\s/.test(line));
  if (!lines.length) return baseResult;

  const summaryLine = lines.find((line) => !line.startsWith("-")) || "";
  const extraSuggestions = lines
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-+\s*/, ""));

  const suggestions = [...baseResult.resumeOptimizationSuggestions, ...extraSuggestions].slice(0, 8);
  return {
    ...baseResult,
    synthesizedSummary: summaryLine || null,
    resumeOptimizationSuggestions: suggestions
  };
}

async function runAnalysis({ resumeText, jobDescription, targetRole }) {
  const deterministic = analyzeResumeVsJob({ resumeText, jobDescription, targetRole });

  const llmResponse = await generateText({
    systemPrompt: RAG_FEEDBACK_SYSTEM_PROMPT,
    userPrompt: buildRagFeedbackPrompt({
      language: deterministic?.metadata?.language || "en",
      targetRole,
      matchedSkills: deterministic.matchedSkills,
      missingSkills: deterministic.missingSkills,
      weightedMatchScore: deterministic.weightedMatchScore
    }),
    temperature: 0.2,
    maxTokens: 500
  });

  const finalResult = applyLlmAssist(deterministic, llmResponse.text);
  finalResult.llm = {
    provider: llmResponse.provider,
    model: llmResponse.model
  };

  const analysisId = await saveAnalysis(finalResult, targetRole || null);
  return getAnalysisById(analysisId);
}

async function getAnalyses(limit = 20) {
  return listAnalyses(limit);
}

module.exports = {
  getAnalysisById,
  getAnalyses,
  runAnalysis
};

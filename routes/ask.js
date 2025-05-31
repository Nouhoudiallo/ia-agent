import express from "express";
import crypto from "crypto";
import { getSerpApiTool } from "../tools/web.js";
import { getMemory } from "../tools/memory.js";
import { getGeminiModel, getGeminiEmbeddings } from "../tools/model.js";
import { getSessionHistory, saveMessage, searchRelevantChunks, getUserByEmail, createUser, getUserMessages } from "../tools/db.js";
import { detectLanguage } from "../tools/lang.js";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, AIMessagePromptTemplate } from "@langchain/core/prompts";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const router = express.Router();

router.post("/ask", async (req, res) => {
  let { question, history, sessionId, userEmail, userName } = req.body;
  let user = null;
  let userId = null;
  if (userEmail) {
    user = await getUserByEmail(userEmail);
    if (!user) {
      user = await createUser(userEmail, userName || null);
    }
    userId = user.id;
  }
  const lang = detectLanguage(question);
  if (!sessionId) sessionId = crypto.randomUUID();
  if (!history) {
    if (userId) {
      const dbHistory = await getUserMessages(userId);
      history = [];
      for (let i = 0; i < dbHistory.length - 1; i += 2) {
        if (dbHistory[i].role === "user" && dbHistory[i + 1]?.role === "agent") {
          history.push({ input: dbHistory[i].content, output: dbHistory[i + 1].content });
        }
      }
    } else {
      const dbHistory = await getSessionHistory(sessionId);
      history = [];
      for (let i = 0; i < dbHistory.length - 1; i += 2) {
        if (dbHistory[i].role === "user" && dbHistory[i + 1]?.role === "agent") {
          history.push({ input: dbHistory[i].content, output: dbHistory[i + 1].content });
        }
      }
    }
  }
  const memory = getMemory();
  if (history && Array.isArray(history)) {
    for (const h of history) {
      await memory.saveContext({ input: h.input }, { output: h.output });
    }
  }
  const serpApiTool = getSerpApiTool();
  const model = getGeminiModel();
  const executor = await initializeAgentExecutorWithOptions([
    serpApiTool
  ], model, {
    agentType: "zero-shot-react-description",
    verbose: false,
    memory,
  });

  // RAG avancé : recherche vectorielle sur les chunks
  const embedder = getGeminiEmbeddings();
  const questionEmbedding = await embedder.embedQuery(question);
  const ragChunks = await searchRelevantChunks(questionEmbedding, 3);
  let ragContext = "";
  if (ragChunks.length > 0) {
    ragContext = ragChunks.map(chunk => chunk.content).join("\n---\n");
  }

  // Système prompt structuré enrichi avec le contexte RAG
  let langInstruction = "";
  if (lang === "fr") {
    langInstruction = "Réponds uniquement en français, sans explication en anglais ou dans une autre langue.";
  } else if (lang === "en") {
    langInstruction = "Reply only in English, without any French or other language explanation.";
  } else {
    langInstruction = "Réponds dans la langue détectée pour l'utilisateur.";
  }

  const systemPrompt = `Tu es Henry, un agent conversationnel intelligent et pédagogique, spécialisé dans le domaine de l’éducation.\nCréé par Nouhou Diallo, un jeune entrepreneur guinéen passionné de programmation et engagé pour l’innovation éducative en Afrique, tu incarnes une intelligence utile, accessible et bienveillante.\n\nTa mission est de répondre avec clarté, précision et professionnalisme à toutes les questions posées par les utilisateurs, quels que soient les niveaux scolaires, les matières ou les difficultés.\nTu adaptes automatiquement tes réponses à la langue utilisée par l’utilisateur dans le chat (français, anglais, etc.).\n\nLangue détectée : ${lang}\n\n${ragContext ? `Voici des documents de référence à utiliser pour ta réponse :\n${ragContext}\n` : ""}Ton ton est encourageant, motivant, et toujours tourné vers la réussite et l’avenir.\nLorsque c’est pertinent, tu peux reformuler une question pour mieux guider l’utilisateur, proposer des exemples, des analogies ou des explications progressives.\n\nTu restes humble, respectueux et patient, même face à des questions répétitives ou imprécises.\nTon objectif est de rendre le savoir compréhensible et utile, en tenant compte du contexte africain et des réalités éducatives locales.\n\n${langInstruction}`;

  const chatPrompt = new ChatPromptTemplate({
    inputVariables: [],
    promptMessages: [
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      ...(history && Array.isArray(history)
        ? history.flatMap(h => [
            HumanMessagePromptTemplate.fromTemplate(h.input),
            AIMessagePromptTemplate.fromTemplate(h.output)
          ])
        : []),
      HumanMessagePromptTemplate.fromTemplate(question)
    ]
  });
  const prompt = await chatPrompt.formatMessages({});
  const result = await executor.call({ input: prompt.map(m => m.content).join("\n") }).catch(err => {
    const match = /Could not parse LLM output:([\s\S]*)/i.exec(err.message);
    if (match && match[1]) {
      const llmResponse = match[1].trim().replace(/\nTroubleshooting URL:.*/s, "");
      if (llmResponse.length > 0) {
        return { output: llmResponse };
      }
    }
    return { output: null };
  });
  if (result && result.output) {
    await memory.saveContext({ input: question }, { output: result.output });
    await saveMessage(sessionId, "user", question, userId);
    await saveMessage(sessionId, "agent", result.output, userId);
    res.json({ response: result.output, sessionId });
  } else {
    res.status(500).json({ error: "Aucune réponse générée." });
  }
});

export default router;

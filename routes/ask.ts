import express, { Request, Response } from "express";
import crypto from "crypto";
import { getSerpApiTool } from "../tools/web.js";
import { getMemory } from "../tools/memory.js";
import { getGeminiModel, getGeminiEmbeddings } from "../tools/model.js";
import { saveMessage, searchRelevantChunks, getUserById, getUserMessages, getDiscussionById, createDiscussion } from "../tools/db.js";
import { detectLanguage } from "../tools/lang.js";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, AIMessagePromptTemplate } from "@langchain/core/prompts";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ApiFactory } from "../utils/apiFactory.js";
import { apiKeyMiddleware } from '../utils/apiFactory.js';

export default ApiFactory.apiRoute("post", "/ask",apiKeyMiddleware, async (req: Request, res: Response) => {
  let { question, userId, discussionId } = req.body as { question: string; userId: string; discussionId?: string };
  if (!userId) {
    return res.status(401).json({ error: "Vous devez être connecté pour discuter avec l'agent." });
  }
  const user = await getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "Vous devez être connecté pour discuter avec l'agent." });
  }
  // Création auto discussion si non fournie
  let discussion = null;
  if (!discussionId) {
    discussion = await createDiscussion(userId, "Nouvelle discussion");
    discussionId = discussion.id;
  } else {
    discussion = await getDiscussionById(discussionId);
    if (!discussion || discussion.userId !== userId) {
      return res.status(403).json({ error: "Discussion invalide ou non autorisée." });
    }
  }
  const lang = detectLanguage(question);
  // Historique : récupération des messages de la discussion
  let dbHistory: any[] = [];
  if (discussion && (discussion as any).messages) {
    dbHistory = (discussion as any).messages;
  } else {
    dbHistory = await getUserMessages(userId);
  }
  let history: { input: string; output: string }[] = [];
  for (let i = 0; i < dbHistory.length - 1; i += 2) {
    if (dbHistory[i].role === "user" && dbHistory[i + 1]?.role === "agent") {
      history.push({ input: dbHistory[i].content, output: dbHistory[i + 1].content });
    }
  }
  const memory = getMemory();
  for (const h of history) {
    await memory.saveContext({ input: h.input }, { output: h.output });
  }
  const serpApiTool = getSerpApiTool();
  const model = getGeminiModel();
  let executor;
  try {
    executor = await initializeAgentExecutorWithOptions([
      serpApiTool
    ], model, {
      agentType: "structured-chat-zero-shot-react-description",
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
      langInstruction = "Réponds uniquement en français, sans salutation, sans te présenter, et va directement à l'essentiel de la réponse. Ne commence jamais par Bonjour, Salut, Coucou, ni aucune formule d'accueil. Ne répète pas ta mission ni ta présentation. Réponds de façon concise et utile à la question posée. Exception : pour le tout premier message d'une discussion (si la discussion ne contient encore aucun message), commence par une salutation et une brève présentation, puis réponds immédiatement à la question posée, sans jamais expliquer le format attendu ni donner d’instructions techniques.";
    } else if (lang === "en") {
      langInstruction = "Reply only in English, without greeting, without introducing yourself, and go straight to the point. Never start with Hello, Hi, or any greeting. Do not repeat your mission or presentation. Answer concisely and usefully to the question. Exception: for the very first message in a discussion (if the discussion contains no message yet), start with a greeting and a brief introduction, then immediately answer the question asked, never explaining the expected format or giving technical instructions.";
    } else {
      langInstruction = "Réponds dans la langue détectée, sans salutation ni présentation, et va directement à l'essentiel de la réponse. Exception : pour le tout premier message d'une discussion (si la discussion ne contient encore aucun message), commence par une salutation et une brève présentation, puis réponds immédiatement à la question posée, sans jamais expliquer le format attendu ni donner d’instructions techniques.";
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
      await saveMessage("user", question, userId, discussionId);
      await saveMessage("agent", result.output, userId, discussionId);
      res.json({ response: result.output, discussionId });
    } else {
      res.status(500).json({ error: "Aucune réponse générée." });
    }
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

import { ApiFactory } from "../utils/apiFactory.js";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const getGeminiModel = ApiFactory.apiTool((): ChatGoogleGenerativeAI => {
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY!,
    model: "gemini-2.5-flash-preview-04-17",
    temperature: 0.7,
  });
});

export const getGeminiEmbeddings = ApiFactory.apiTool((): GoogleGenerativeAIEmbeddings => {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY!,
    model: "embedding-001",
  });
});
export {};

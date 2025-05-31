import { getGeminiEmbeddings } from "../tools/model.js";
import { searchRelevantChunks } from "../tools/db.js";

export async function getRagContext(question, topK = 3) {
  const embedder = getGeminiEmbeddings();
  const questionEmbedding = await embedder.embedQuery(question);
  const ragChunks = await searchRelevantChunks(questionEmbedding, topK);
  if (ragChunks.length > 0) {
    return ragChunks.map(chunk => chunk.content).join("\n---\n");
  }
  return "";
}

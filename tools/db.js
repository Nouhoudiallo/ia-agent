import { PrismaClient } from '@prisma/client';
import { getGeminiEmbeddings } from "./model.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function createUser(email, name, password) {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { email, name, password: hash } });
}

export async function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export async function verifyUserPassword(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return false;
  return bcrypt.compare(password, user.password);
}

export async function getUserMessages(userId) {
  return prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function saveMessage(sessionId, role, content, userId = null) {
  return prisma.message.create({
    data: { sessionId, role, content, userId }
  });
}

export async function getSessionHistory(sessionId) {
  // Retourne l'historique trié par date
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function saveDocument(title, content) {
  return prisma.document.create({ data: { title, content } });
}

export async function searchDocuments(query, limit = 3) {
  // Recherche simple par mots-clés (améliorable par embeddings plus tard)
  return prisma.document.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function saveDocumentChunks(documentId, chunks, embeddings) {
  // chunks: array de string, embeddings: array d'embeddings (array de float)
  const data = chunks.map((content, i) => ({
    content,
    embedding: JSON.stringify(embeddings[i]),
    documentId
  }));
  return prisma.documentChunk.createMany({ data });
}

export async function searchRelevantChunks(queryEmbedding, limit = 3) {
  // Récupère tous les chunks, calcule la similarité cosinus, retourne les meilleurs
  const allChunks = await prisma.documentChunk.findMany();
  function cosineSim(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  const scored = allChunks.map(chunk => {
    const emb = JSON.parse(chunk.embedding);
    return { ...chunk, score: cosineSim(queryEmbedding, emb) };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export default prisma;

import { ApiFactory } from "../utils/apiFactory.js";
import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";
export const createUser = ApiFactory.apiTool(async (email, name, password) => {
    const hash = await bcrypt.hash(password, 10);
    return prisma.user.create({ data: { email, name, password: hash } });
});
export const getUserByEmail = ApiFactory.apiTool(async (email) => {
    return prisma.user.findUnique({ where: { email } });
});
export const getUserById = ApiFactory.apiTool(async (id) => {
    return prisma.user.findUnique({ where: { id } });
});
export const verifyUserPassword = ApiFactory.apiTool(async (email, password) => {
    const user = await getUserByEmail(email);
    if (!user)
        return false;
    return bcrypt.compare(password, user.password);
});
export const getUserMessages = ApiFactory.apiTool(async (userId) => {
    return prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
    });
});
export const saveMessage = ApiFactory.apiTool(async (role, content, userId = null, discussionId = null) => {
    return prisma.message.create({
        data: { role, content, userId, discussionId }
    });
});
export const saveDocument = ApiFactory.apiTool(async (title, content) => {
    return prisma.document.create({ data: { title, content } });
});
export const searchDocuments = ApiFactory.apiTool(async (query, limit = 3) => {
    return prisma.document.findMany({
        where: {
            OR: [
                { title: { contains: query } },
                { content: { contains: query } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
});
export async function saveDocumentChunks(documentId, chunks, embeddings) {
    const data = chunks.map((content, i) => ({
        content,
        embedding: JSON.stringify(embeddings[i]),
        documentId
    }));
    return prisma.documentChunk.createMany({ data });
}
export async function searchRelevantChunks(queryEmbedding, limit = 3) {
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
export async function createDiscussion(userId, title = null) {
    return prisma.discussion.create({ data: { userId, title } });
}
export async function getDiscussionById(id) {
    return prisma.discussion.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
}
export async function getUserDiscussions(userId) {
    return prisma.discussion.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
}
export default prisma;

import prisma from "../utils/prisma.js";

export async function getApiKey() {
  const apiKey = await prisma.apiKey.findFirst({ orderBy: { createdAt: 'desc' } });
  return apiKey?.key || null;
}

export async function setApiKey(key: string) {
  await prisma.apiKey.deleteMany({});
  return prisma.apiKey.create({ data: { key } });
}

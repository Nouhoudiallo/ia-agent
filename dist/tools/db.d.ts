import prisma from "../utils/prisma.js";
export declare const createUser: (email: string, name: string, password: string) => Promise<{
    name: string | null;
    id: string;
    email: string;
    password: string;
    createdAt: Date;
}>;
export declare const getUserByEmail: (email: string) => Promise<{
    name: string | null;
    id: string;
    email: string;
    password: string;
    createdAt: Date;
} | null>;
export declare const getUserById: (id: string) => Promise<{
    name: string | null;
    id: string;
    email: string;
    password: string;
    createdAt: Date;
} | null>;
export declare const verifyUserPassword: (email: string, password: string) => Promise<boolean>;
export declare const getUserMessages: (userId: string) => Promise<{
    id: string;
    createdAt: Date;
    role: string;
    content: string;
    userId: string | null;
    discussionId: string | null;
}[]>;
export declare const saveMessage: (role: string, content: string, userId?: string | null, discussionId?: string | null) => Promise<{
    id: string;
    createdAt: Date;
    role: string;
    content: string;
    userId: string | null;
    discussionId: string | null;
}>;
export declare const saveDocument: (title: string, content: string) => Promise<{
    id: string;
    createdAt: Date;
    content: string;
    title: string;
}>;
export declare const searchDocuments: (query: string, limit?: number) => Promise<{
    id: string;
    createdAt: Date;
    content: string;
    title: string;
}[]>;
export declare function saveDocumentChunks(documentId: string, chunks: string[], embeddings: number[][]): Promise<import("@prisma/client").Prisma.BatchPayload>;
export declare function searchRelevantChunks(queryEmbedding: number[], limit?: number): Promise<{
    score: number;
    id: string;
    createdAt: Date;
    content: string;
    embedding: string;
    documentId: string;
}[]>;
export declare function createDiscussion(userId: string, title?: string | null): Promise<{
    id: string;
    createdAt: Date;
    userId: string | null;
    title: string | null;
}>;
export declare function getDiscussionById(id: string): Promise<({
    messages: {
        id: string;
        createdAt: Date;
        role: string;
        content: string;
        userId: string | null;
        discussionId: string | null;
    }[];
} & {
    id: string;
    createdAt: Date;
    userId: string | null;
    title: string | null;
}) | null>;
export declare function getUserDiscussions(userId: string): Promise<({
    messages: {
        id: string;
        createdAt: Date;
        role: string;
        content: string;
        userId: string | null;
        discussionId: string | null;
    }[];
} & {
    id: string;
    createdAt: Date;
    userId: string | null;
    title: string | null;
})[]>;
export default prisma;
export {};

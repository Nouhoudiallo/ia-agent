export declare function getApiKey(): Promise<string | null>;
export declare function setApiKey(key: string): Promise<{
    id: string;
    createdAt: Date;
    key: string;
}>;

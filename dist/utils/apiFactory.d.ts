/**
 * Fabrique pour créer facilement des routes API et des outils réutilisables (TypeScript).
 * Utilisation :
 *   - apiRoute(method, path, handler) => retourne un Router Express typé
 *   - apiTool(logic) => retourne une fonction réutilisable typée
 */
import express, { Router, Request, Response, NextFunction } from "express";
export type HttpMethod = "get" | "post" | "put" | "delete";
export declare function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): Promise<express.Response<any, Record<string, any>> | undefined>;
export declare class ApiFactory {
    /**
     * Crée une route Express prête à être utilisée
     * @param method Méthode HTTP ("get", "post", etc.)
     * @param path Chemin de la route
     * @param handler Fonction handler Express typée
     * @returns Router Express
     */
    static apiRoute(method: HttpMethod, path: string, middleware: (req: Request, res: Response, next: NextFunction) => Promise<any> | void, handler: (req: Request, res: Response) => Promise<any> | void): Router;
    /**
     * Crée un outil réutilisable (service, logique métier, etc.)
     * @param logic Fonction métier typée
     * @returns Fonction typée
     */
    static apiTool<T extends (...args: any[]) => any>(logic: T): T;
}

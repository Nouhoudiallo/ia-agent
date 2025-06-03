/**
 * Fabrique pour créer facilement des routes API et des outils réutilisables (TypeScript).
 * Utilisation :
 *   - apiRoute(method, path, handler) => retourne un Router Express typé
 *   - apiTool(logic) => retourne une fonction réutilisable typée
 */

import express, { Router, Request, Response, NextFunction } from "express";
import { getApiKey } from "../tools/apiKeyTool.js";

export type HttpMethod = "get" | "post" | "put" | "delete";

// Middleware de vérification de la clé API
export async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey || req.body.apiKey;
  if (!apiKey) {
    return res.status(401).json({ error: 'Clé API obligatoire.' });
  }
  const validApiKey = await getApiKey();
  if (!validApiKey || apiKey !== validApiKey) {
    return res.status(403).json({ error: 'Clé API invalide ou inexistante.' });
  }
  next();
}

export class ApiFactory {
  /**
   * Crée une route Express prête à être utilisée
   * @param method Méthode HTTP ("get", "post", etc.)
   * @param path Chemin de la route
   * @param handler Fonction handler Express typée
   * @returns Router Express
   */
  static apiRoute(
    method: HttpMethod,
    path: string,
    middleware: (req: Request, res: Response, next: NextFunction) => Promise<any> | void,
    handler: (req: Request, res: Response) => Promise<any> | void
  ): Router {
    const router = express.Router();
    router[method](path, middleware, async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req, res);
      } catch (e) {
        next(e);
      }
    });
    return router;
  }

  /**
   * Crée un outil réutilisable (service, logique métier, etc.)
   * @param logic Fonction métier typée
   * @returns Fonction typée
   */
  static apiTool<T extends (...args: any[]) => any>(logic: T): T {
    return ((...args: Parameters<T>): ReturnType<T> => logic(...args)) as T;
  }
}

// Exemple d'utilisation :
// import { ApiFactory } from "../utils/apiFactory";
// const route = ApiFactory.apiRoute("post", "/hello", async (req, res) => { res.json({ msg: "ok" }); });
// const tool = ApiFactory.apiTool(async (a: number, b: number) => a + b);

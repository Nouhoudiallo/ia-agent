import { ApiFactory, apiKeyMiddleware } from "../utils/apiFactory.js";
import { Request, Response } from "express";
import { createUser, getUserByEmail, verifyUserPassword } from "../tools/db.js";

// Création d'utilisateur (signup)
const signupHandler = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis." });
  const existing = await getUserByEmail(email);
  if (existing) return res.status(400).json({ error: "Utilisateur déjà existant." });
  await createUser(email, name ?? "", password);
  res.json({ success: true });
};

// Authentification utilisateur (login)
const loginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis." });
  const valid = await verifyUserPassword(email, password);
  if (!valid) return res.status(401).json({ error: "Identifiants invalides." });
  res.json({ success: true });
};

export const signupRoute = ApiFactory.apiRoute("post", "/user/signup",apiKeyMiddleware, signupHandler);
export const loginRoute = ApiFactory.apiRoute("post", "/user/login",apiKeyMiddleware, loginHandler);

// Pour compatibilité avec l'import par défaut
import express from "express";
const router = express.Router();
router.post('/user/signup', apiKeyMiddleware, signupHandler);
router.post('/user/login', apiKeyMiddleware, loginHandler);
export default router;

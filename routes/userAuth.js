import express from "express";
import { createUser, getUserByEmail, verifyUserPassword } from "../tools/db.js";

const router = express.Router();

// Création d'utilisateur (signup)
router.post("/user/signup", async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis." });
  const existing = await getUserByEmail(email);
  if (existing) return res.status(400).json({ error: "Utilisateur déjà existant." });
  await createUser(email, name, password);
  res.json({ success: true });
});

// Authentification utilisateur (login)
router.post("/user/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis." });
  const valid = await verifyUserPassword(email, password);
  if (!valid) return res.status(401).json({ error: "Identifiants invalides." });
  res.json({ success: true });
});

export default router;

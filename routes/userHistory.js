import express from "express";
import { getUserByEmail, getUserMessages } from "../tools/db.js";

const router = express.Router();

router.get("/user-history", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email requis" });
  const user = await getUserByEmail(email);
  if (!user) return res.json({ history: [] });
  const messages = await getUserMessages(user.id);
  res.json({ history: messages });
});

export default router;

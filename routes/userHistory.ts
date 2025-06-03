import { ApiFactory, apiKeyMiddleware } from "../utils/apiFactory.js";
import { Request, Response } from "express";
import { getUserByEmail, getUserMessages } from "../tools/db.js";

export default ApiFactory.apiRoute("get", "/user-history", apiKeyMiddleware, async (req: Request, res: Response) => {
  const { email } = req.query as { email?: string };
  if (!email) return res.status(400).json({ error: "Email requis" });
  const user = await getUserByEmail(email);
  if (!user) return res.json({ history: [] });
  const messages = await getUserMessages(user.id);
  res.json({ history: messages });
});

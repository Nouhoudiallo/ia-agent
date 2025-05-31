import express from "express";
import { saveDocument } from "../tools/db.js";

const router = express.Router();

router.post("/upload-doc", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Titre et contenu requis." });
  }
  try {
    await saveDocument(title, content);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur lors de l'enregistrement du document." });
  }
});

export default router;

import { Router } from "express";
import { setApiKey, getApiKey } from "../tools/apiKeyTool.js";
const router = Router();
// Générer une nouvelle clé API et la stocker
router.post("/generate-api-key", async (req, res) => {
    const { key } = req.body;
    if (!key)
        return res.status(400).json({ error: "Clé API manquante." });
    await setApiKey(key);
    res.json({ success: true, key });
});
// Récupérer la clé API courante (pour affichage front)
router.get("/get-api-key", async (_req, res) => {
    const key = await getApiKey();
    if (!key)
        return res.status(404).json({ error: "Aucune clé API trouvée." });
    res.json({ key });
});
export default router;

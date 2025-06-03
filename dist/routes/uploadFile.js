import { ApiFactory, apiKeyMiddleware } from "../utils/apiFactory.js";
import fs from "fs";
import mammoth from "mammoth";
import { saveDocument, saveDocumentChunks } from "../tools/db.js";
import { getGeminiEmbeddings } from "../tools/model.js";
import { chunkText } from "../utils/text.js";
export default ApiFactory.apiRoute("post", "/upload-file", apiKeyMiddleware, async (req, res) => {
    const file = req.file;
    const title = req.body.title || (file ? file.originalname : "");
    if (!file || !fs.existsSync(file.path)) {
        console.error("[UPLOAD] Fichier manquant ou introuvable:", file ? file.path : null);
        return res.status(400).json({ error: "Aucun fichier reçu ou fichier introuvable." });
    }
    let content = "";
    try {
        if (file.mimetype === "application/pdf") {
            fs.unlinkSync(file.path);
            return res.status(400).json({ error: "L'import de PDF n'est plus supporté." });
        }
        else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.mimetype === "application/msword") {
            const data = await mammoth.extractRawText({ path: file.path });
            content = data.value;
        }
        else {
            // Pour les autres formats texte
            content = fs.readFileSync(file.path, "utf8");
        }
        const doc = await saveDocument(title, content);
        // Découpage + embeddings
        const chunks = chunkText(content);
        const embedder = getGeminiEmbeddings();
        const embeddings = await embedder.embedDocuments(chunks);
        await saveDocumentChunks(doc.id, chunks, embeddings);
        fs.unlinkSync(file.path); // Nettoyage du fichier temporaire
        res.json({ success: true });
    }
    catch (e) {
        if (file && file.path && fs.existsSync(file.path))
            fs.unlinkSync(file.path);
        console.error("[UPLOAD] Erreur lors du traitement du fichier:", e);
        res.status(500).json({ error: "Erreur lors du traitement du fichier." });
    }
});

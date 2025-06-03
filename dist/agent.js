import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import askRoute from "./routes/ask.js";
import uploadDocRoute from "./routes/uploadDoc.js";
import uploadFileRoute from "./routes/uploadFile.js";
import userHistoryRoute from "./routes/userHistory.js";
import apiKeyRoute from "./routes/apiKey.js";
// Chargement des variables d'environnement
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: "uploads/" });
// Middleware pour la route upload-file
app.use("/api/upload-file", upload.single("file"));
app.use("/api", askRoute);
app.use("/api", uploadDocRoute);
app.use("/api", uploadFileRoute);
app.use("/api", userHistoryRoute);
app.use("/api", apiKeyRoute);
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "chat.html"));
});
app.listen(3000, () => {
    console.log("API IA agent démarrée sur http://localhost:3000");
});

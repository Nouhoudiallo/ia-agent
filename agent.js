// Agent IA de base avec LangChain.js
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import * as dotenv from "dotenv";
import { getSerpApiTool } from "./tools/web.js";
import { getReadlineInterface } from "./tools/io.js";
import { getMemory } from "./tools/memory.js";
import { getGeminiModel, getGeminiEmbeddings } from "./tools/model.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { saveMessage, getSessionHistory, saveDocument, searchDocuments, saveDocumentChunks, searchRelevantChunks } from "./tools/db.js";
import crypto from "crypto";
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, AIMessagePromptTemplate } from "@langchain/core/prompts";
import { detectLanguage } from "./tools/lang.js";
import multer from "multer";
import mammoth from "mammoth";
import fs from "fs";
import askRoute from "./routes/ask.js";
import uploadDocRoute from "./routes/uploadDoc.js";
import uploadFileRoute from "./routes/uploadFile.js";
import userHistoryRoute from "./routes/userHistory.js";
import authRoute from "./routes/auth.js";

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
app.use("/api", authRoute);

// async function runAgent() {
//   // Création de l'interface readline pour l'input utilisateur
//   const rl = getReadlineInterface();

//   // Ajout d'une mémoire pour stocker l'historique des conversations
//   const memory = getMemory();

//   // Initialisation de l'outil SerpAPI pour la recherche web
//   const serpApiTool = getSerpApiTool();

//   function askQuestion() {
//     rl.question("Entrez votre question : ", async (userInput) => {
//       const model = getGeminiModel();

//       const executor = await initializeAgentExecutorWithOptions(
//         [serpApiTool],
//         model,
//         {
//           agentType: "zero-shot-react-description",
//           verbose: false,
//           memory, // Ajout de la mémoire à l'agent
//         }
//       );

//       const result = await executor
//         .call({
//           input: userInput,
//         })
//         .catch((err) => {
//           const match = /Could not parse LLM output:([\s\S]*)/i.exec(
//             err.message
//           );
//           if (match && match[1]) {
//             const llmResponse = match[1]
//               .trim()
//               .replace(/\nTroubleshooting URL:.*/s, "");
//             if (llmResponse.length > 0) {
//               console.log(llmResponse);
//               return { output: llmResponse };
//             }
//           }
//           // Afficher l'erreur pour debug
//           console.error("Erreur agent:", err.message);
//           return { output: null };
//         });
//       if (result && result.output) {
//         console.log(result.output); // Affiche la réponse de l'agent
//         await memory.saveContext(
//           { input: userInput },
//           { output: result.output }
//         );
//       }

//       rl.question(
//         "Voulez-vous continuer la discussion ? (o/n) : ",
//         (answer) => {
//           if (answer.toLowerCase() === "o") {
//             askQuestion();
//           } else {
//             rl.close();
//           }
//         }
//       );
//     });
//   }
//   askQuestion();
// }

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.listen(3000, () => {
  console.log("API IA agent démarrée sur http://localhost:3000");
});

// runAgent();

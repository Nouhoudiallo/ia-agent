import { franc } from "franc";

export function detectLanguage(text) {
  // franc retourne un code ISO 639-3, on simplifie pour fr/en sinon "other"
  const code = franc(text);
  if (code === "fra") return "fr";
  if (code === "eng") return "en";
  return "other";
}

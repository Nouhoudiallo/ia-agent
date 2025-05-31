import { SerpAPI } from "@langchain/community/tools/serpapi";

export function getSerpApiTool() {
  return new SerpAPI(process.env.SERPAPI_API_KEY, {
    location: "France",
    hl: "fr",
    gl: "fr"
  });
}

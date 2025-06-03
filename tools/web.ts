import { ApiFactory } from "../utils/apiFactory.js";
import { SerpAPI } from "@langchain/community/tools/serpapi";

export const getSerpApiTool = ApiFactory.apiTool((): SerpAPI => {
  return new SerpAPI(process.env.SERPAPI_API_KEY, {
    location: "France",
    hl: "fr",
    gl: "fr"
  });
});
export {};

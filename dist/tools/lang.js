import { ApiFactory } from "../utils/apiFactory.js";
import { franc } from "franc";
export const detectLanguage = ApiFactory.apiTool((text) => {
    const code = franc(text);
    if (code === "fra")
        return "fr";
    if (code === "eng")
        return "en";
    return "other";
});

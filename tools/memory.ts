import { ApiFactory } from "../utils/apiFactory.js";
import { BufferMemory } from "langchain/memory";

export const getMemory = ApiFactory.apiTool((): BufferMemory => {
  return new BufferMemory();
});
export {};

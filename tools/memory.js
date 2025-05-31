import { BufferMemory } from "langchain/memory";

export function getMemory() {
  return new BufferMemory();
}

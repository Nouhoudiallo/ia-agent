export function chunkText(text: string, chunkSize: number = 1500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  let chunks: string[] = [], current = "";
  for (const s of sentences) {
    if ((current + s).length > chunkSize) {
      if (current) chunks.push(current);
      current = s;
    } else {
      current += (current ? " " : "") + s;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

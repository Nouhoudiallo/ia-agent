export function chunkText(text, chunkSize = 1500) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    let chunks = [], current = "";
    for (const s of sentences) {
        if ((current + s).length > chunkSize) {
            if (current)
                chunks.push(current);
            current = s;
        }
        else {
            current += (current ? " " : "") + s;
        }
    }
    if (current)
        chunks.push(current);
    return chunks;
}

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import type { DocumentChunk } from "../types/document.js";

import { normalizeDocumentText } from "../utils/normalizeText.js";

interface CreateChunksOptions {
  documentId: string;
  documentName: string;
  category: string;
  text: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export async function createDocumentChunks({
  documentId,
  documentName,
  category,
  text,
  chunkSize = 1200,
  chunkOverlap = 200,
}: CreateChunksOptions): Promise<DocumentChunk[]> {
  if (chunkSize < 1) {
    throw new Error("Chunk size must be greater than zero.");
  }

  if (chunkOverlap < 0) {
    throw new Error("Chunk overlap cannot be negative.");
  }

  if (chunkOverlap >= chunkSize) {
    throw new Error("Chunk overlap must be smaller than chunk size.");
  }

  const cleanedText = normalizeDocumentText(text);

  if (!cleanedText) {
    return [];
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const splitTexts = await splitter.splitText(cleanedText);

  return splitTexts.map((content, index) => ({
    id: `${documentId}-${index}`,
    documentId,
    documentName,
    category,
    content,
    chunkIndex: index,
  }));
}

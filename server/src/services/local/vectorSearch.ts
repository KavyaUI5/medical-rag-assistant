import { generateEmbedding } from "./embeddingService.js";
import { getMedicalCollection } from "./chromaService.js";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentName: string;
  category: string;
  content: string;
  chunkIndex: number;
  distance: number;
  score: number;
}

export async function retrieveRelevantChunks(
  question: string,
  category?: string,
  topK = 5,
): Promise<RetrievedChunk[]> {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    throw new Error("Question is required.");
  }

  if (topK < 1) {
    throw new Error("topK must be greater than zero.");
  }

  const questionEmbedding = await generateEmbedding(normalizedQuestion);

  const collection = await getMedicalCollection();

  const results = await collection.query({
    queryEmbeddings: [questionEmbedding],
    nResults: topK,

    where: category
      ? {
          category,
        }
      : undefined,

    include: ["documents", "metadatas", "distances"],
  });

  const ids = results.ids[0] ?? [];
  const documents = results.documents?.[0] ?? [];
  const metadatas = results.metadatas?.[0] ?? [];
  const distances = results.distances?.[0] ?? [];

  const chunks: RetrievedChunk[] = [];

  for (let index = 0; index < ids.length; index += 1) {
    const content = documents[index];
    const metadata = metadatas[index];

    if (!content || !metadata) {
      continue;
    }

    const distance = distances[index] ?? 1;
    const score = 1 - distance;

    chunks.push({
      id: ids[index],

      documentId: String(metadata.documentId ?? ""),

      documentName: String(metadata.documentName ?? "Unknown document"),

      category: String(metadata.category ?? "Unknown"),

      content,

      chunkIndex: Number(metadata.chunkIndex ?? index),

      distance,
      score,
    });
  }

  return chunks;
}

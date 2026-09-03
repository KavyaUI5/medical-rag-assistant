import { retrieveRelevantChunks, type RetrievedChunk } from "./vectorSearch.js";

import { generateAnswerWithOllama } from "./ollamaChatService.js";

import { classifyMedicalCategories } from "./categoryClassifierService.js";

const RETRIEVAL_CANDIDATE_COUNT = 25;
const RESULTS_PER_CATEGORY = 4;
const MAX_CONTEXT_CHUNKS = 10;
const MAX_CHUNKS_PER_DOCUMENT = 4;
const MINIMUM_RELEVANCE_SCORE = 0.45;

const NOT_FOUND_RESPONSE =
  "I could not find that information in the " + "provided medical documents.";

const MEDICAL_DISCLAIMER =
  "This assistant provides educational information " +
  "from approved documents and does not replace " +
  "professional medical advice, diagnosis, or treatment.";

export interface LocalCitation {
  documentId: string;
  documentName: string;
  category: string;
  chunkIndex: number;
  score: number;
}

export interface LocalRagResponse {
  answer: string;
  citations: LocalCitation[];
  disclaimer: string;
}

function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, index) =>
      `
SOURCE ${index + 1}
Document: ${chunk.documentName}
Category: ${chunk.category}
Chunk: ${chunk.chunkIndex}

Content:
${chunk.content}
      `.trim(),
    )
    .join("\n\n");
}

function buildCitations(chunks: RetrievedChunk[]): LocalCitation[] {
  return chunks.map((chunk) => ({
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    category: chunk.category,
    chunkIndex: chunk.chunkIndex,
    score: Number(chunk.score.toFixed(4)),
  }));
}

function selectDiverseChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const documentCounts = new Map<string, number>();
  const selectedChunks: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    const currentCount = documentCounts.get(chunk.documentId) ?? 0;

    if (currentCount >= MAX_CHUNKS_PER_DOCUMENT) {
      continue;
    }

    selectedChunks.push(chunk);

    documentCounts.set(chunk.documentId, currentCount + 1);

    if (selectedChunks.length >= MAX_CONTEXT_CHUNKS) {
      break;
    }
  }

  return selectedChunks;
}

async function retrieveCandidates(
  question: string,
  selectedCategory?: string,
): Promise<RetrievedChunk[]> {
  /*
   * If the user selected a category from the UI,
   * use it directly and skip LLM classification.
   */
  if (selectedCategory) {
    console.log("Using selected category:", selectedCategory);

    return retrieveRelevantChunks(
      question,
      selectedCategory,
      RETRIEVAL_CANDIDATE_COUNT,
    );
  }

  let detectedCategories: string[] = [];

  try {
    detectedCategories = await classifyMedicalCategories(question);

    console.log("Automatically classified categories:", detectedCategories);
  } catch (error: unknown) {
    console.warn(
      "Category classification failed. " + "Searching all documents instead.",
      error,
    );
  }

  /*
   * If the classifier returns no category, perform
   * an unrestricted search. The relevance threshold
   * will still prevent weak results from being used.
   */
  if (detectedCategories.length === 0) {
    console.log("No category detected. Searching all documents.");

    return retrieveRelevantChunks(
      question,
      undefined,
      RETRIEVAL_CANDIDATE_COUNT,
    );
  }

  /*
   * For one detected category, retrieve more candidates.
   * This helps when one category contains multiple PDFs,
   * such as diabetes-guide and diabetes-prevention.
   */
  if (detectedCategories.length === 1) {
    return retrieveRelevantChunks(
      question,
      detectedCategories[0],
      RETRIEVAL_CANDIDATE_COUNT,
    );
  }

  /*
   * For multi-category questions, retrieve a few chunks
   * from every detected category. This prevents one
   * document from dominating all search results.
   */
  const candidates: RetrievedChunk[] = [];

  for (const category of detectedCategories) {
    const categoryResults = await retrieveRelevantChunks(
      question,
      category,
      RESULTS_PER_CATEGORY,
    );

    candidates.push(...categoryResults);
  }

  return candidates.sort((first, second) => second.score - first.score);
}

export async function answerLocalMedicalQuestion(
  question: string,
  category?: string,
): Promise<LocalRagResponse> {
  const normalizedQuestion = question.trim();
  const normalizedCategory = category?.trim();

  if (!normalizedQuestion) {
    throw new Error("Question is required.");
  }

  const retrievedChunks = await retrieveCandidates(
    normalizedQuestion,
    normalizedCategory || undefined,
  );

  const thresholdChunks = retrievedChunks.filter(
    (chunk) => chunk.score >= MINIMUM_RELEVANCE_SCORE,
  );

  const relevantChunks = selectDiverseChunks(thresholdChunks);

  console.log(
    `Retrieved ${retrievedChunks.length} candidates; ` +
      `${thresholdChunks.length} passed the threshold; ` +
      `${relevantChunks.length} selected for context.`,
  );

  relevantChunks.forEach((chunk) => {
    console.log({
      documentName: chunk.documentName,
      category: chunk.category,
      chunkIndex: chunk.chunkIndex,
      score: Number(chunk.score.toFixed(4)),
    });
  });

  if (relevantChunks.length === 0) {
    return {
      answer: NOT_FOUND_RESPONSE,
      citations: [],
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const context = buildContext(relevantChunks);

  const answer = await generateAnswerWithOllama(normalizedQuestion, context);

  return {
    answer,
    citations: buildCitations(relevantChunks),
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

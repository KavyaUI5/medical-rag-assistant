import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateEmbedding,
} from '../../services/local/embeddingService.js';

import {
  getMedicalCollection,
} from '../../services/local/chromaService.js';

import type {
  DocumentChunk,
} from '../../types/document.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const chunksFilePath = path.resolve(
  currentDirectory,
  '../../../data/medical-document-chunks.json',
);

const uploadBatchSize = 25;

async function loadDocumentChunks():
  Promise<DocumentChunk[]> {
  const rawData = await fs.readFile(
    chunksFilePath,
    'utf-8',
  );

  const chunks = JSON.parse(rawData) as DocumentChunk[];

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error(
      'No document chunks were found. Run processDocuments.ts first.',
    );
  }

  return chunks;
}

async function indexLocalDocuments(): Promise<void> {
  console.log('Loading document chunks...');

  const chunks = await loadDocumentChunks();

  console.log(`Found ${chunks.length} chunks.`);

  const collection = await getMedicalCollection();
  const existingCount = await collection.count();

  console.log(
    `Existing Chroma records: ${existingCount}`,
  );

  for (
    let start = 0;
    start < chunks.length;
    start += uploadBatchSize
  ) {
    const batch = chunks.slice(
      start,
      start + uploadBatchSize,
    );

    const embeddings: number[][] = [];

    for (const chunk of batch) {
      console.log(
        `Generating embedding for ${chunk.id}`,
      );

      const embedding = await generateEmbedding(
        chunk.content,
      );

      embeddings.push(embedding);
    }

    await collection.upsert({
      ids: batch.map((chunk) => chunk.id),

      embeddings,

      documents: batch.map(
        (chunk) => chunk.content,
      ),

      metadatas: batch.map((chunk) => ({
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        category: chunk.category,
        chunkIndex: chunk.chunkIndex,
      })),
    });

    const uploadedCount = Math.min(
      start + batch.length,
      chunks.length,
    );

    console.log(
      `Uploaded ${uploadedCount}/${chunks.length} chunks`,
    );
  }

  const finalCount = await collection.count();

  console.log('Local document indexing completed.');
  console.log(
    `Records now stored in ChromaDB: ${finalCount}`,
  );
}

indexLocalDocuments().catch((error: unknown) => {
  console.error(
    'Local document indexing failed:',
    error,
  );

  process.exit(1);
});
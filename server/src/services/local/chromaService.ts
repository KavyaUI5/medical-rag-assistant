import 'dotenv/config';

import {
  ChromaClient,
  type Collection,
} from 'chromadb';

const chromaHost =
  process.env.CHROMA_HOST ?? 'localhost';

const chromaPort = Number(
  process.env.CHROMA_PORT ?? 8000,
);

const collectionName =
  process.env.CHROMA_COLLECTION_NAME ??
  'medical-documents';

if (!Number.isInteger(chromaPort)) {
  throw new Error(
    'CHROMA_PORT must be a valid integer.',
  );
}

export const chromaClient = new ChromaClient({
  host: chromaHost,
  port: chromaPort,
});

let collectionPromise:
  Promise<Collection> | null = null;

export function getMedicalCollection():
  Promise<Collection> {
  if (!collectionPromise) {
    collectionPromise =
      chromaClient.getOrCreateCollection({
        name: collectionName,
        embeddingFunction: null,

        configuration: {
          hnsw: {
            space: 'cosine',
          },
        },
      });
  }

  return collectionPromise;
}

export async function verifyChromaConnection():
  Promise<number> {
  return chromaClient.heartbeat();
}

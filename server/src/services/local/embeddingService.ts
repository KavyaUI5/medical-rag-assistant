
import {
  pipeline,
  type FeatureExtractionPipeline,
} from '@huggingface/transformers';

const EMBEDDING_MODEL =
  'Xenova/all-MiniLM-L6-v2';

const EXPECTED_EMBEDDING_SIZE = 384;

let extractorPromise:
  Promise<FeatureExtractionPipeline> | null = null;

function getExtractor():
  Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    console.log(
      `Loading local embedding model: ${EMBEDDING_MODEL}`,
    );

    extractorPromise = pipeline(
      'feature-extraction',
      EMBEDDING_MODEL,
      {
        dtype: 'q8',
      },
    );
  }

  return extractorPromise;
}

export async function generateEmbedding(
  text: string,
): Promise<number[]> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error(
      'Cannot generate an embedding for empty text.',
    );
  }

  const extractor = await getExtractor();

  const output = await extractor(normalizedText, {
    pooling: 'mean',
    normalize: true,
  });

  const embedding = Array.from(
    output.data as Float32Array,
  );

  if (
    embedding.length !== EXPECTED_EMBEDDING_SIZE
  ) {
    throw new Error(
      `Expected ${EXPECTED_EMBEDDING_SIZE} dimensions, ` +
      `but received ${embedding.length}.`,
    );
  }

  return embedding;
}
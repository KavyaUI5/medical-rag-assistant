import { generateEmbedding } from
  '../../services/local/embeddingService.js';

async function main(): Promise<void> {
  const text =
    'Common asthma symptoms include coughing and wheezing.';

  console.log('Generating local embedding...');

  const embedding = await generateEmbedding(text);

  console.log('Embedding generated successfully.');
  console.log('Embedding length:', embedding.length);
  console.log(
    'First five values:',
    embedding.slice(0, 5),
  );
}

main().catch((error) => {
  console.error(
    'Local embedding test failed:',
    error,
  );

  process.exit(1);
});
import { retrieveRelevantChunks } from '../../services/local/vectorSearch.js';

async function main(): Promise<void> {
  const commandLineQuestion = process.argv
    .slice(2)
    .join(' ')
    .trim();

  const question =
    commandLineQuestion || 'What are asthma symptoms?';

  console.log(`Question: ${question}`);
  console.log('Searching ChromaDB...');

  const chunks = await retrieveRelevantChunks(
    question,
    undefined,
    5,
  );

  if (chunks.length === 0) {
    console.log('No relevant chunks were found.');
    return;
  }

  console.log(`Found ${chunks.length} results.`);

  chunks.forEach((chunk, index) => {
    console.log('\n------------------------------');
    console.log(`Result: ${index + 1}`);
    console.log(`Document: ${chunk.documentName}`);
    console.log(`Category: ${chunk.category}`);
    console.log(`Chunk: ${chunk.chunkIndex}`);
    console.log(
      `Distance: ${chunk.distance.toFixed(4)}`,
    );
    console.log('Content:');
    console.log(chunk.content.slice(0, 500));
  });
}

main().catch((error: unknown) => {
  console.error('Vector search test failed:', error);
  process.exit(1);
});
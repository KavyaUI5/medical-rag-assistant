import {
  answerLocalMedicalQuestion,
} from '../../services/local/localRagService.js';

async function main(): Promise<void> {
  const question =
    process.argv.slice(2).join(' ').trim() ||
    'What are asthma symptoms?';

  console.log(`Question: ${question}`);
  console.log('Running local RAG pipeline...\n');

  const result =
    await answerLocalMedicalQuestion(question);

  console.log('\nAnswer:');
  console.log(result.answer);

  console.log('\nSources:');

  if (result.citations.length === 0) {
    console.log('No sources found.');
    return;
  }

  result.citations.forEach((citation, index) => {
    console.log(
      `${index + 1}. ${citation.documentName} ` +
        `(category: ${citation.category}, ` +
        `chunk: ${citation.chunkIndex}, ` +
        `score: ${citation.score})`,
    );
  });
}

main().catch((error: unknown) => {
  console.error('Local RAG test failed:', error);
  process.exit(1);
});
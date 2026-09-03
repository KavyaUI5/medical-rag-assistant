import {
  generateAnswerWithOllama,
} from '../../services/local/ollamaChatService.js';

async function main(): Promise<void> {
  const context = `
Source document: asthma-action-plan.pdf

Early asthma warning signs may include a mild cough,
mild difficulty breathing, mild wheezing, chest
tightness, and waking up at night.
  `;

  const question = 'What are asthma warning signs?';

  console.log(`Question: ${question}`);
  console.log('Generating answer with Ollama...');

  const answer = await generateAnswerWithOllama(
    question,
    context,
  );

  console.log('\nAnswer:');
  console.log(answer);
}

main().catch((error: unknown) => {
  console.error('Ollama chat test failed:', error);
  process.exit(1);
});
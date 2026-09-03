import {
  getMedicalCollection,
  verifyChromaConnection,
} from '../../services/local/chromaService.js';

async function main(): Promise<void> {
  console.log('Connecting to ChromaDB...');

  const heartbeat =
    await verifyChromaConnection();

  console.log(
    'Chroma heartbeat:',
    heartbeat,
  );

  const collection =
    await getMedicalCollection();

  const recordCount = await collection.count();

  console.log(
    'Collection name:',
    collection.name,
  );

  console.log(
    'Existing records:',
    recordCount,
  );

  console.log(
    'Chroma connection successful.',
  );
}

main().catch((error) => {
  console.error(
    'Chroma connection test failed:',
    error,
  );

  process.exit(1);
});
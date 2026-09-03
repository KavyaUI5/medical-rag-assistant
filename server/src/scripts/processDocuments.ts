import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractPdfText } from '../services/pdfService.js';
import { createDocumentChunks } from '../services/chunkingService.js';
import type { DocumentChunk } from '../types/document.js';

const currentFilePath = fileURLToPath(import.meta.url);

const currentDirectory = path.dirname(currentFilePath);

const documentsDirectory = path.resolve(currentDirectory, '../../../documents');

const outputDirectory = path.resolve(currentDirectory, '../../data');

const medicalDocuments = [
  {
    fileName: 'asthma-action-plan.pdf',
    documentId: 'asthma-action-plan',
    category: 'Asthma',
  },
  {
    fileName: 'blood-pressure-guide.pdf',
    documentId: 'blood-pressure-guide',
    category: 'Hypertension',
  },
  {
    fileName: 'cholesterol-guide.pdf',
    documentId: 'cholesterol-guide',
    category: 'Cholesterol',
  },
  {
    fileName: 'diabetes-guide.pdf',
    documentId: 'diabetes-guide',
    category: 'Diabetes',
  },
  {
    fileName: 'diabetes-prevention.pdf',
    documentId: 'diabetes-prevention',
    category: 'Diabetes',
  },
  {
    fileName: 'heart-health-guide.pdf',
    documentId: 'heart-health-guide',
    category: 'Heart Health',
  },
];

async function processDocuments(): Promise<void> {
  const allChunks: DocumentChunk[] = [];

  for (const document of medicalDocuments) {
    try {
      const filePath = path.join(documentsDirectory, document.fileName);

      console.log(`\nProcessing: ${document.fileName}`);

      const extractedText = await extractPdfText(filePath);

      console.log(`Extracted ${extractedText.length} characters`);

      const chunks = await createDocumentChunks({
        documentId: document.documentId,
        documentName: document.fileName,
        category: document.category,
        text: extractedText,
      });

      console.log(`Created ${chunks.length} chunks`);

      if (chunks.length > 0) {
        console.log('First chunk preview:');

        console.log(chunks[0].content.slice(0, 300));
      }

      allChunks.push(...chunks);
    } catch (error) {
      console.error(`Failed to process ${document.fileName}:`, error);
    }
  }

  await fs.mkdir(outputDirectory, {
    recursive: true,
  });

  const outputFilePath = path.join(
    outputDirectory,
    'medical-document-chunks.json',
  );

  await fs.writeFile(
    outputFilePath,
    JSON.stringify(allChunks, null, 2),
    'utf-8',
  );

  console.log('\nProcessing complete');
  console.log(`Documents configured: ${medicalDocuments.length}`);
  console.log(`Total chunks created: ${allChunks.length}`);
  console.log(`Output saved to: ${outputFilePath}`);
}

processDocuments().catch((error) => {
  console.error('Document processing failed:', error);
  process.exit(1);
});

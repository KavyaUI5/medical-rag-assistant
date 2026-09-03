import fs from "node:fs/promises";
import pdf from "pdf-parse";

import { normalizeDocumentText } from "../utils/normalizeText.js";

export async function extractPdfText(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const result = await pdf(fileBuffer);

  const cleanedText = normalizeDocumentText(result.text);

  if (!cleanedText) {
    throw new Error(`No readable text found in ${filePath}`);
  }

  return cleanedText;
}

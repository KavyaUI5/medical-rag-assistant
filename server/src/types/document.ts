//This represents one small piece of a PDF
export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  category: string;
  content: string;
  chunkIndex: number;
}

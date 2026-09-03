export interface Citation {
    documentId: string;
    documentName: string;
    category: string;
    chunkIndex: number;
    score: number;
}

export interface RagResponse {
    success: true;
    answer: string;
    citations: Citation[];
    disclaimer: string;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
}
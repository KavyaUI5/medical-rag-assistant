import type {
    ApiErrorResponse,
    RagResponse,
} from '../types/rag';

const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:5000';

export async function askMedicalQuestion(
    question: string,
    category?: string,
): Promise<RagResponse> {
    const response = await fetch(
        `${apiBaseUrl}/api/rag/ask`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify({
                question,
                category: category || undefined,
            }),
        },
    );

    const data = (await response.json()) as
        | RagResponse
        | ApiErrorResponse;

    if (!response.ok || !data.success) {
        const message =
            'message' in data
                ? data.message
                : 'Unable to get an answer.';

        throw new Error(message);
    }

    return data;
}
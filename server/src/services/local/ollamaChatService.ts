import "dotenv/config";

interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
  };

  error?: string;
}

const ollamaBaseUrl = (
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
).replace(/\/$/, "");

const ollamaModel = process.env.OLLAMA_CHAT_MODEL ?? "llama3.2:3b";

export async function generateAnswerWithOllama(
  question: string,
  context: string,
): Promise<string> {
  const normalizedQuestion = question.trim();
  const normalizedContext = context.trim();

  if (!normalizedQuestion) {
    throw new Error("Question is required.");
  }

  if (!normalizedContext) {
    return (
      "I could not find that information in the " +
      "provided medical documents."
    );
  }

  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      model: ollamaModel,
      stream: false,

      messages: [
        {
          role: "system",

          content: `
You are an educational medical knowledge assistant.

Rules:
1. Answer only from the provided medical context.
2. Do not add information from general knowledge.
3. Do not diagnose medical conditions.
4. Do not prescribe medication or recommend dosage changes.
5. Do not provide personalized treatment recommendations.
6. Do not invent facts, document names, or citations.
7. If the context does not contain the answer, say:
   "I could not find that information in the provided medical documents."
8. Encourage consultation with a qualified healthcare professional
   for personalized medical advice.
9. Keep the answer clear, concise, and empathetic.
10. Do not mention SOURCE numbers, chunk numbers, scores, or context labels.
11. Do not reproduce the context headers in the answer.
12. Answer directly in natural language and combine relevant details
    from multiple supplied sources.
            `.trim(),
        },

        {
          role: "user",

          content: `
MEDICAL CONTEXT:
${normalizedContext}

QUESTION:
${normalizedQuestion}

Answer using only the medical context.
            `.trim(),
        },
      ],

      options: {
        temperature: 0.1,
        num_predict: 300,
      },
    }),

    signal: AbortSignal.timeout(600_000),
  });

  const data = (await response.json()) as OllamaChatResponse;

  if (!response.ok) {
    throw new Error(
      data.error ?? `Ollama request failed with status ${response.status}.`,
    );
  }

  const answer = data.message?.content?.trim();

  if (!answer) {
    throw new Error("Ollama returned an empty answer.");
  }

  return answer;
}

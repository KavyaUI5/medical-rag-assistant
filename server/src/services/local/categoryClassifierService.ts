import 'dotenv/config';

export const medicalCategories = [
  'Asthma',
  'Hypertension',
  'Cholesterol',
  'Diabetes',
  'Heart Health',
] as const;

export type MedicalCategory = (typeof medicalCategories)[number];

interface OllamaClassifierResponse {
  message?: {
    content?: string;
  };

  error?: string;
}

interface ClassificationResult {
  categories: unknown;
}

const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL ??  'http://localhost:11434').replace(/\/$/, '');
const ollamaModel =  process.env.OLLAMA_CHAT_MODEL ??  'llama3.2:3b';

function isMedicalCategory(
  value: unknown,
): value is MedicalCategory {
  return (
    typeof value === 'string' &&
    medicalCategories.includes(
      value as MedicalCategory,
    )
  );
}

function detectCategoriesWithRules(
  question: string,
): MedicalCategory[] {
  const normalizedQuestion = question.toLowerCase();

  const categories = new Set<MedicalCategory>();

  const bloodPressureReadingPattern = /\b\d{2,3}\s*(?:\/|over)\s*\d{2,3}\b/i;

  if (
    /\basthma\b|\bwheez(?:e|ing)\b|\binhaler\b/i.test(
      normalizedQuestion,
    )
  ) {
    categories.add('Asthma');
  }

  if (
    /\bblood pressure\b|\bhypertension\b|\bsystolic\b|\bdiastolic\b|\bbp reading\b|\bhigh bp\b/i.test(
      normalizedQuestion,
    ) ||
    bloodPressureReadingPattern.test(
      normalizedQuestion,
    )
  ) {
    categories.add('Hypertension');
  }

  if (
    /\bcholesterol\b|\bldl\b|\bhdl\b|\btriglycerides?\b/i.test(
      normalizedQuestion,
    )
  ) {
    categories.add('Cholesterol');
  }

  if (
    /\bdiabetes\b|\bdiabetic\b|\bblood sugar\b|\bglucose\b|\ba1c\b/i.test(
      normalizedQuestion,
    )
  ) {
    categories.add('Diabetes');
  }

  if (
    /\bheart health\b|\bheart disease\b|\bcardiac\b|\bcoronary\b|\bheart attack\b/i.test(
      normalizedQuestion,
    )
  ) {
    categories.add('Heart Health');
  }

  return Array.from(categories);
}

export async function classifyMedicalCategories(
  question: string,
): Promise<MedicalCategory[]> {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    return [];
  }

  const ruleCategories =  detectCategoriesWithRules(normalizedQuestion);
  if (ruleCategories.length > 0) {
    return ruleCategories;
  }

  try {
    const response = await fetch(
      `${ollamaBaseUrl}/api/chat`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          model: ollamaModel,
          stream: false,

          messages: [
            {
              role: 'system',

              content: `
Classify a user question into one or more medical
document categories.

Allowed categories:
- Asthma
- Hypertension
- Cholesterol
- Diabetes
- Heart Health

Rules:
1. Select only categories directly relevant to the question.
2. Multiple categories are allowed.
3. Return an empty array for unrelated questions.
4. Do not answer or diagnose.
5. A reading written as "number over number", such as
   "150 over 95", refers to the Hypertension category.
6. Return only the requested JSON structure.

Examples:
Question: My reading is 150 over 95. What does it mean?
Categories: ["Hypertension"]

Question: What do LDL and HDL mean?
Categories: ["Cholesterol"]

Question: How do I repair a car?
Categories: []
              `.trim(),
            },

            {
              role: 'user',
              content: normalizedQuestion,
            },
          ],

          format: {
            type: 'object',

            properties: {
              categories: {
                type: 'array',

                items: {
                  type: 'string',
                  enum: medicalCategories,
                },

                uniqueItems: true,
              },
            },

            required: ['categories'],
            additionalProperties: false,
          },

          options: {
            temperature: 0,
            num_predict: 100,
          },
        }),

        signal: AbortSignal.timeout(180_000),
      },
    );

    const data =
      (await response.json()) as OllamaClassifierResponse;

    if (!response.ok) {
      throw new Error(
        data.error ??
        'Ollama category classification failed.',
      );
    }

    const content = data.message?.content;

    if (!content) {
      throw new Error(
        'Category classifier returned no content.',
      );
    }

    const parsed = JSON.parse(content) as ClassificationResult;

    const ollamaCategories = Array.isArray(parsed.categories)
        ? parsed.categories.filter(
          isMedicalCategory,
        )
        : [];

    return Array.from(
      new Set([
        ...ruleCategories,
        ...ollamaCategories,
      ]),
    );
  } catch (error: unknown) {
    console.warn(
      'Ollama category classification failed; ' +
      'using rule-based categories.',
      error,
    );

    return ruleCategories;
  }
}
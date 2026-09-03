import {
    type FormEvent,
    useMemo,
    useState,
} from 'react';

import ReactMarkdown from 'react-markdown';

import {
    askMedicalQuestion,
} from '../services/api';

import type {
    Citation,
    RagResponse,
} from '../types/rag';

interface CitationGroup {
    documentId: string;
    documentName: string;
    category: string;
    chunkIndexes: number[];
    bestScore: number;
}

const categories = [
    'Asthma',
    'Hypertension',
    'Cholesterol',
    'Diabetes',
    'Heart Health',
];

function groupCitations(
    citations: Citation[],
): CitationGroup[] {
    const groups = new Map<string, CitationGroup>();

    citations.forEach((citation) => {
        const existing = groups.get(
            citation.documentId,
        );

        if (existing) {
            existing.chunkIndexes.push(
                citation.chunkIndex,
            );

            existing.bestScore = Math.max(
                existing.bestScore,
                citation.score,
            );

            return;
        }

        groups.set(citation.documentId, {
            documentId: citation.documentId,
            documentName: citation.documentName,
            category: citation.category,
            chunkIndexes: [citation.chunkIndex],
            bestScore: citation.score,
        });
    });

    return Array.from(groups.values());
}

export default function AssistantPage() {
    const [question, setQuestion] = useState('');
    const [category, setCategory] = useState('');
    const [result, setResult] =
        useState<RagResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const groupedCitations = useMemo(
        () => groupCitations(result?.citations ?? []),
        [result],
    );

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const normalizedQuestion = question.trim();

        if (!normalizedQuestion) {
            setError('Please enter a question.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setResult(null);

            const response = await askMedicalQuestion(
                normalizedQuestion,
                category || undefined,
            );

            setResult(response);
        } catch (requestError: unknown) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to get an answer.';

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="assistant-page">
            <header className="hero">
                <p className="eyebrow">
                    APPROVED MEDICAL DOCUMENTS
                </p>

                <h1>Medical Knowledge Assistant</h1>

                <p className="hero-description">
                    Ask educational questions about asthma,
                    diabetes, blood pressure, cholesterol and
                    heart health.
                </p>
            </header>

            <section
                className="safety-notice"
                aria-label="Medical safety notice"
            >
                This assistant does not provide diagnoses,
                prescriptions or personalized treatment.
                Contact local emergency services for a medical
                emergency.
            </section>

            <section className="assistant-card">
                <form onSubmit={handleSubmit}>
                    <label htmlFor="category">
                        Document category
                    </label>

                    <select
                        id="category"
                        value={category}
                        onChange={(event) =>
                            setCategory(event.target.value)
                        }
                        disabled={loading}
                    >
                        <option value="">All documents</option>

                        {categories.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="question">
                        Your question
                    </label>

                    <textarea
                        id="question"
                        value={question}
                        onChange={(event) =>
                            setQuestion(event.target.value)
                        }
                        placeholder="Example: What are asthma warning signs?"
                        rows={5}
                        disabled={loading}
                    />

                    <button
                        className="submit-button"
                        type="submit"
                        disabled={loading || !question.trim()}
                    >
                        {loading
                            ? 'Searching medical documents...'
                            : 'Ask question'}
                    </button>
                </form>

                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                <div aria-live="polite">
                    {loading && (
                        <div className="loading-message">
                            Retrieving relevant information and
                            generating a grounded answer…
                        </div>
                    )}

                    {result && (
                        <section className="answer-section">
                            <h2>Answer</h2>

                            <div className="answer-content">
                                <ReactMarkdown>
                                    {result.answer}
                                </ReactMarkdown>
                            </div>

                            <h2>Sources</h2>

                            {groupedCitations.length > 0 ? (
                                <div className="citation-list">
                                    {groupedCitations.map((citation) => (
                                        <article
                                            className="citation-card"
                                            key={citation.documentId}
                                        >
                                            <h3>
                                                {citation.documentName}
                                            </h3>

                                            <p>
                                                Category: {citation.category}
                                            </p>

                                            <p>
                                                Relevant chunks:{' '}
                                                {citation.chunkIndexes.join(', ')}
                                            </p>

                                            <p>
                                                Best similarity score:{' '}
                                                {citation.bestScore.toFixed(4)}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p>
                                    No supporting sources were found.
                                </p>
                            )}

                            <p className="disclaimer">
                                {result.disclaimer}
                            </p>
                        </section>
                    )}
                </div>
            </section>
        </main>
    );
}
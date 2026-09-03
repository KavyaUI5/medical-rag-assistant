import request from "supertest";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./services/local/localRagService.js", () => ({
  answerLocalMedicalQuestion: vi.fn(),
}));

import app from "./app.js";

import { answerLocalMedicalQuestion } from "./services/local/localRagService.js";

const mockedAnswerLocalMedicalQuestion = vi.mocked(answerLocalMedicalQuestion);

describe("Medical RAG API", () => {
  beforeEach(() => {
    mockedAnswerLocalMedicalQuestion.mockReset();
  });

  it("returns the health status", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Medical RAG server is running.",
    });
  });

  it("returns 404 for an unknown endpoint", async () => {
    const response = await request(app).get("/api/unknown").expect(404);

    expect(response.body).toEqual({
      success: false,
      message: "Endpoint not found.",
    });
  });

  it("rejects an empty question", async () => {
    const response = await request(app)
      .post("/api/rag/ask")
      .send({
        question: "",
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: "Question is required.",
    });

    expect(mockedAnswerLocalMedicalQuestion).not.toHaveBeenCalled();
  });

  it("rejects a missing request body", async () => {
    const response = await request(app).post("/api/rag/ask").expect(400);

    expect(response.body).toEqual({
      success: false,
      message: "Question is required.",
    });
  });

  it("rejects an unsupported category", async () => {
    const response = await request(app)
      .post("/api/rag/ask")
      .send({
        question: "What are asthma symptoms?",
        category: "Respiratory",
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: "Unsupported medical category.",
    });
  });

  it("returns a grounded RAG response", async () => {
    mockedAnswerLocalMedicalQuestion.mockResolvedValue({
      answer: "Asthma warning signs may include wheezing.",
      citations: [
        {
          documentId: "asthma-action-plan",
          documentName: "asthma-action-plan.pdf",
          category: "Asthma",
          chunkIndex: 53,
          score: 0.6339,
        },
      ],
      disclaimer: "Educational information only.",
    });

    const response = await request(app)
      .post("/api/rag/ask")
      .send({
        question: "What are asthma warning signs?",
        category: "Asthma",
      })
      .expect(200);

    expect(mockedAnswerLocalMedicalQuestion).toHaveBeenCalledWith(
      "What are asthma warning signs?",
      "Asthma",
    );

    expect(response.body.success).toBe(true);
    expect(response.body.answer).toContain("Asthma warning signs");
    expect(response.body.citations).toHaveLength(1);
  });
});

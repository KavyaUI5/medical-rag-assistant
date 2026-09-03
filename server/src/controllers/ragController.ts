import type { Request, Response } from "express";

import { answerLocalMedicalQuestion } from "../services/local/localRagService.js";

import {
  medicalCategories,
  type MedicalCategory,
} from "../services/local/categoryClassifierService.js";

interface AskRequestBody {
  question?: unknown;
  category?: unknown;
}

function isMedicalCategory(value: string): value is MedicalCategory {
  return medicalCategories.some((category) => category === value);
}

export async function askMedicalQuestion(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const body = req.body as AskRequestBody | undefined;

    const { question, category } = body ?? {};

    if (typeof question !== "string" || !question.trim()) {
      res.status(400).json({
        success: false,
        message: "Question is required.",
      });

      return;
    }

    if (category !== undefined && typeof category !== "string") {
      res.status(400).json({
        success: false,
        message: "Category must be a string.",
      });

      return;
    }

    const normalizedCategory =
      typeof category === "string" ? category.trim() : undefined;

    if (normalizedCategory && !isMedicalCategory(normalizedCategory)) {
      res.status(400).json({
        success: false,
        message: "Unsupported medical category.",
      });

      return;
    }

    const result = await answerLocalMedicalQuestion(
      question.trim(),
      normalizedCategory || undefined,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error("RAG request failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to answer the question at this time.",
    });
  }
}

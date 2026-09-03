import { describe, expect, it } from "vitest";

import { classifyMedicalCategories } from "./categoryClassifierService.js";

describe("classifyMedicalCategories", () => {
  it("classifies asthma keywords", async () => {
    await expect(
      classifyMedicalCategories("What can trigger asthma and wheezing?"),
    ).resolves.toEqual(["Asthma"]);
  });

  it("classifies a blood-pressure reading", async () => {
    await expect(
      classifyMedicalCategories("My reading is 150 over 95."),
    ).resolves.toEqual(["Hypertension"]);
  });

  it("classifies multiple explicit categories", async () => {
    const categories = await classifyMedicalCategories(
      "How do blood pressure, cholesterol, " + "and heart health relate?",
    );

    expect(categories).toEqual(["Hypertension", "Cholesterol", "Heart Health"]);
  });

  it("returns no categories for an empty question", async () => {
    await expect(classifyMedicalCategories("  ")).resolves.toEqual([]);
  });
});

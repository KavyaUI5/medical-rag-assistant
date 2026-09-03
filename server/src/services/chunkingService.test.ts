import { describe, expect, it } from "vitest";

import { createDocumentChunks } from "./chunkingService.js";

describe("createDocumentChunks", () => {
  it("creates chunks with document metadata", async () => {
    const chunks = await createDocumentChunks({
      documentId: "asthma-guide",
      documentName: "asthma-guide.pdf",
      category: "Asthma",
      text: "Asthma symptoms include coughing. ".repeat(10),
      chunkSize: 100,
      chunkOverlap: 20,
    });

    expect(chunks.length).toBeGreaterThan(1);

    expect(chunks[0]).toMatchObject({
      id: "asthma-guide-0",
      documentId: "asthma-guide",
      documentName: "asthma-guide.pdf",
      category: "Asthma",
      chunkIndex: 0,
    });

    expect(chunks[0].content).not.toBe("");
  });

  it("returns no chunks for empty text", async () => {
    await expect(
      createDocumentChunks({
        documentId: "empty",
        documentName: "empty.pdf",
        category: "Other",
        text: "   ",
      }),
    ).resolves.toEqual([]);
  });

  it("rejects overlap equal to chunk size", async () => {
    await expect(
      createDocumentChunks({
        documentId: "test",
        documentName: "test.pdf",
        category: "Asthma",
        text: "Some medical text.",
        chunkSize: 100,
        chunkOverlap: 100,
      }),
    ).rejects.toThrow("Chunk overlap must be smaller than chunk size.");
  });
});

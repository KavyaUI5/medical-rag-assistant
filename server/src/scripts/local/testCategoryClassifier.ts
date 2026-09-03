import { classifyMedicalCategories } from "../../services/local/categoryClassifierService.js";

async function main(): Promise<void> {
  const question =
    process.argv.slice(2).join(" ").trim() ||
    "How do blood pressure and cholesterol affect heart health?";

  const categories = await classifyMedicalCategories(question);

  console.log("Question:", question);
  console.log("Categories:", categories);
}

main().catch(console.error);

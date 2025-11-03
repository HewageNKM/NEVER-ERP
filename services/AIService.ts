import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Calls the Gemini API to create an embedding for a search query.
 * @param text The user's search string.
 * @returns A vector (array of numbers).
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const result = await model.embedContent({
      content: { parts: [{ text }], role: "user" },
      taskType: TaskType.RETRIEVAL_QUERY,
    });

    const embedding = result.embedding;
    if (!embedding?.values) {
      throw new Error("No embedding returned from Gemini API.");
    }

    return embedding.values;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw new Error("Failed to generate search embedding.");
  }
};

import "server-only";
import { z } from "zod";
import { GroqApiError } from "@/lib/ai/groq";

// Sections where the question IS the language skill being tested — translating
// them would defeat the point, so the alt-language toggle never applies here.
export const NON_TRANSLATABLE_SECTION_CODES = new Set(["HINDI", "ENGLISH"]);

function isDevanagari(text: string): boolean {
  return /[ऀ-ॿ]/.test(text);
}

const TranslationSchema = z.object({
  translations: z.array(z.string().trim().min(1)).length(5),
});

/**
 * Translates a question + its 4 options as one batch (keeps them contextually
 * consistent) between Hindi and English, whichever direction the source isn't
 * already in. Detected from script (Devanagari vs Latin) rather than a stored
 * language field, so it works regardless of how a question was authored.
 */
export async function translateQuestion(
  text: string,
  options: string[]
): Promise<{ text: string; options: string[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  if (!apiKey || !model) {
    throw new GroqApiError("Translation is not configured.");
  }

  const sourceIsHindi = isDevanagari(text);
  const targetLanguage = sourceIsHindi ? "English" : "Hindi";

  const prompt = [
    `Translate the following exam question and its 4 multiple-choice options into ${targetLanguage}.`,
    `Keep the meaning and difficulty exactly the same — this is for an exam, not general text.`,
    `Keep proper nouns, place names, and numbers as-is where a translation would be unnatural.`,
    ``,
    `Question: ${text}`,
    `Option 1: ${options[0]}`,
    `Option 2: ${options[1]}`,
    `Option 3: ${options[2]}`,
    `Option 4: ${options[3]}`,
    ``,
    `Respond with ONLY a JSON object of this exact shape, no other text:`,
    `{"translations": ["translated question", "translated option 1", "translated option 2", "translated option 3", "translated option 4"]}`,
  ].join("\n");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new GroqApiError(`Groq translation request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new GroqApiError("Groq translation response did not include message content.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new GroqApiError("Groq translation response was not valid JSON.");
  }

  const parsed = TranslationSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new GroqApiError("Groq translation response did not match the expected shape.");
  }

  const [translatedText, ...translatedOptions] = parsed.data.translations;
  return { text: translatedText, options: translatedOptions };
}

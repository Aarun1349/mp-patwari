import "server-only";
import { z } from "zod";

export class GroqApiError extends Error {}

const GeneratedQuestionSchema = z
  .object({
    text: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
  })
  .refine((q) => new Set(q.options.map((o) => o.trim().toLowerCase())).size === 4, {
    message: "the four options must be distinct",
  });

const GeneratedResponseSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});

export interface GeneratedQuestion {
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

/** Plain fetch to Groq's OpenAI-compatible chat completions endpoint — matches
 * this codebase's Razorpay/MSG91/Google pattern of no vendor SDK. */
export async function generateQuestions(
  sectionNameEn: string,
  count: number,
  topicHint: string
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  if (!apiKey || !model) {
    throw new GroqApiError("AI question generation is not configured.");
  }

  const prompt = [
    `Generate ${count} multiple-choice practice questions for the "${sectionNameEn}" section`,
    `of an MP Patwari (Madhya Pradesh state recruitment exam, India) mock test.`,
    topicHint ? `Focus specifically on: ${topicHint}.` : "",
    `Questions should be in Hindi if the subject is typically taught/tested in Hindi in this exam`,
    `(General Knowledge, Math & Reasoning, Hindi, Rural Economy & Panchayati Raj), or English for`,
    `the General English and Computer Knowledge sections. Each question must have exactly 4 distinct`,
    `options with exactly one correct answer. Keep questions factually accurate and at a level`,
    `appropriate for a state-level recruitment exam (not overly advanced, not trivial).`,
    ``,
    `Respond with ONLY a JSON object of this exact shape, no other text:`,
    `{"questions": [{"text": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0}]}`,
    `correctIndex is the 0-based index into options of the correct answer.`,
  ]
    .filter(Boolean)
    .join(" ");

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
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new GroqApiError(`Groq API request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new GroqApiError("Groq response did not include message content.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new GroqApiError("Groq response was not valid JSON.");
  }

  const parsed = GeneratedResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new GroqApiError(`Groq response did not match the expected shape: ${parsed.error.issues[0]?.message}`);
  }

  return parsed.data.questions.map((q) => ({
    text: q.text,
    options: q.options as [string, string, string, string],
    correctIndex: q.correctIndex as 0 | 1 | 2 | 3,
  }));
}

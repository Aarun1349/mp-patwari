"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/adminSession";
import { prisma } from "@/lib/prisma";
import { generateQuestions, GroqApiError, type GeneratedQuestion } from "@/lib/ai/groq";

const MAX_GENERATE_COUNT = 15;

export type GenerateState =
  | { questions: GeneratedQuestion[]; paperId: string; sectionId: string }
  | { error: string }
  | undefined;

const GenerateSchema = z.object({
  paperId: z.string().min(1),
  sectionId: z.string().min(1),
  count: z.coerce.number().int().min(1).max(MAX_GENERATE_COUNT),
  topicHint: z.string().trim().max(200).optional(),
});

export async function generateQuestionsAction(
  _prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const parsed = GenerateSchema.safeParse({
    paperId: formData.get("paperId"),
    sectionId: formData.get("sectionId"),
    count: formData.get("count"),
    topicHint: formData.get("topicHint") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const section = await prisma.section.findUnique({ where: { id: parsed.data.sectionId } });
  if (!section) return { error: "Section not found." };

  try {
    const questions = await generateQuestions(section.nameEn, parsed.data.count, parsed.data.topicHint ?? "");
    return { questions, paperId: parsed.data.paperId, sectionId: parsed.data.sectionId };
  } catch (err) {
    if (err instanceof GroqApiError) return { error: err.message };
    console.error("generateQuestionsAction failed", err);
    return { error: "Something went wrong generating questions. Please try again." };
  }
}

export type SaveGeneratedState = { error?: string } | undefined;

export async function saveGeneratedQuestionsAction(
  _prevState: SaveGeneratedState,
  formData: FormData
): Promise<SaveGeneratedState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const paperId = String(formData.get("paperId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");
  const count = Number(formData.get("count") ?? 0);
  if (!paperId || !sectionId || !count) return { error: "Missing data — please regenerate." };

  const toCreate: {
    text: string;
    options: string[];
    correctIndex: number;
  }[] = [];

  for (let i = 0; i < count; i++) {
    if (formData.get(`q_${i}_include`) !== "on") continue;

    const text = String(formData.get(`q_${i}_text`) ?? "").trim();
    const options = [0, 1, 2, 3].map((j) => String(formData.get(`q_${i}_option_${j}`) ?? "").trim());
    const correctIndex = Number(formData.get(`q_${i}_correctIndex`) ?? -1);

    if (!text || options.some((o) => !o) || correctIndex < 0 || correctIndex > 3) {
      return { error: `Question ${i + 1} is missing required fields.` };
    }
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) {
      return { error: `Question ${i + 1}'s options must be distinct.` };
    }

    toCreate.push({ text, options, correctIndex });
  }

  if (toCreate.length === 0) return { error: "No questions selected to save." };

  await prisma.$transaction(
    toCreate.map((q) =>
      prisma.question.create({
        data: {
          paperId,
          sectionId,
          text: q.text,
          marks: 2,
          negativeMarks: 0.5,
          options: {
            create: q.options.map((text, idx) => ({
              label: ["A", "B", "C", "D"][idx],
              text,
              isCorrect: idx === q.correctIndex,
              sortOrder: idx,
            })),
          },
        },
      })
    )
  );

  revalidatePath(`/admin/papers/${paperId}`);
  redirect(`/admin/papers/${paperId}`);
}

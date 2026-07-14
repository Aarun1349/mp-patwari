"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/adminSession";
import { prisma } from "@/lib/prisma";
import { translateQuestion, NON_TRANSLATABLE_SECTION_CODES } from "@/lib/ai/translate";

/** How many questions to translate per click — bounded so the action stays well
 * under serverless timeouts; the admin clicks again until 0 remain. */
const TRANSLATE_BATCH = 20;

export type PaperActionState = { error?: string } | undefined;
export type QuestionActionState = { error?: string } | undefined;

const PaperSchema = z.object({
  title: z.string().trim().min(1),
  isFree: z.boolean(),
  durationMinutes: z.coerce.number().int().positive(),
  totalQuestions: z.coerce.number().int().positive(),
  totalMarks: z.coerce.number().int().positive(),
  negativeMarkingRatio: z.coerce.number().min(0).max(1),
});

export async function updatePaperAction(
  _prevState: PaperActionState,
  formData: FormData
): Promise<PaperActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  const parsed = PaperSchema.safeParse({
    title: formData.get("title"),
    isFree: formData.get("isFree") === "on",
    durationMinutes: formData.get("durationMinutes"),
    totalQuestions: formData.get("totalQuestions"),
    totalMarks: formData.get("totalMarks"),
    negativeMarkingRatio: formData.get("negativeMarkingRatio"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.paper.update({ where: { id }, data: parsed.data });
  revalidatePath(`/admin/papers/${id}`);
  revalidatePath("/admin/papers");
  return undefined;
}

/**
 * Pre-translates a batch of the paper's questions to the alt language (Hindi)
 * and caches the result on `textAlt`, so the exam room can serve the language
 * toggle instantly from the bulk /paper load instead of doing a live Groq
 * translation mid-exam. Processes up to TRANSLATE_BATCH per call; skips language
 * sections (Hindi/English) where translation would defeat the point.
 */
export async function pretranslatePaperAction(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;

  const paperId = String(formData.get("paperId") ?? "");
  if (!paperId) return;

  const questions = await prisma.question.findMany({
    where: { paperId, isActive: true },
    select: {
      id: true,
      text: true,
      textAlt: true,
      section: { select: { code: true } },
      options: { select: { id: true, text: true, textAlt: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  const pending = questions
    .filter(
      (q) =>
        !NON_TRANSLATABLE_SECTION_CODES.has(q.section.code) &&
        (q.textAlt == null || q.options.some((o) => o.textAlt == null))
    )
    .slice(0, TRANSLATE_BATCH);

  for (const q of pending) {
    try {
      const translated = await translateQuestion(
        q.text,
        q.options.map((o) => o.text)
      );
      await prisma.$transaction([
        prisma.question.update({ where: { id: q.id }, data: { textAlt: translated.text } }),
        ...q.options.map((o, i) =>
          prisma.questionOption.update({ where: { id: o.id }, data: { textAlt: translated.options[i] ?? o.text } })
        ),
      ]);
    } catch {
      // Skip failures — the next click retries whatever is still pending.
    }
  }

  revalidatePath(`/admin/papers/${paperId}`);
}

export async function togglePaperActiveAction(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) return;

  await prisma.paper.update({ where: { id }, data: { isActive: !paper.isActive } });
  revalidatePath("/admin/papers");
  revalidatePath(`/admin/papers/${id}`);
}

const QuestionSchema = z
  .object({
    sectionId: z.string().min(1),
    text: z.string().trim().min(1),
    optionA: z.string().trim().min(1),
    optionB: z.string().trim().min(1),
    optionC: z.string().trim().min(1),
    optionD: z.string().trim().min(1),
    correctOption: z.enum(["A", "B", "C", "D"]),
    marks: z.coerce.number().min(0),
    negativeMarks: z.coerce.number().min(0),
  })
  .refine(
    (v) => new Set([v.optionA, v.optionB, v.optionC, v.optionD].map((o) => o.trim().toLowerCase())).size === 4,
    { message: "the four options must be distinct" }
  );

export async function createQuestionAction(
  _prevState: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const paperId = String(formData.get("paperId") ?? "");
  const parsed = QuestionSchema.safeParse({
    sectionId: formData.get("sectionId"),
    text: formData.get("text"),
    optionA: formData.get("optionA"),
    optionB: formData.get("optionB"),
    optionC: formData.get("optionC"),
    optionD: formData.get("optionD"),
    correctOption: formData.get("correctOption"),
    marks: formData.get("marks"),
    negativeMarks: formData.get("negativeMarks"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const options = [
    { label: "A", text: parsed.data.optionA },
    { label: "B", text: parsed.data.optionB },
    { label: "C", text: parsed.data.optionC },
    { label: "D", text: parsed.data.optionD },
  ];

  await prisma.question.create({
    data: {
      paperId,
      sectionId: parsed.data.sectionId,
      text: parsed.data.text,
      marks: parsed.data.marks,
      negativeMarks: parsed.data.negativeMarks,
      options: {
        create: options.map((o, idx) => ({
          label: o.label,
          text: o.text,
          isCorrect: o.label === parsed.data.correctOption,
          sortOrder: idx,
        })),
      },
    },
  });

  revalidatePath(`/admin/papers/${paperId}`);
  redirect(`/admin/papers/${paperId}`);
}

export async function updateQuestionAction(
  _prevState: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const questionId = String(formData.get("questionId") ?? "");
  const paperId = String(formData.get("paperId") ?? "");
  const parsed = QuestionSchema.safeParse({
    sectionId: formData.get("sectionId"),
    text: formData.get("text"),
    optionA: formData.get("optionA"),
    optionB: formData.get("optionB"),
    optionC: formData.get("optionC"),
    optionD: formData.get("optionD"),
    correctOption: formData.get("correctOption"),
    marks: formData.get("marks"),
    negativeMarks: formData.get("negativeMarks"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existingOptions = await prisma.questionOption.findMany({
    where: { questionId },
    orderBy: { sortOrder: "asc" },
  });
  const newTexts = [parsed.data.optionA, parsed.data.optionB, parsed.data.optionC, parsed.data.optionD];
  const labels = ["A", "B", "C", "D"];

  await prisma.$transaction([
    prisma.question.update({
      where: { id: questionId },
      data: {
        sectionId: parsed.data.sectionId,
        text: parsed.data.text,
        marks: parsed.data.marks,
        negativeMarks: parsed.data.negativeMarks,
      },
    }),
    ...existingOptions.map((opt, idx) =>
      prisma.questionOption.update({
        where: { id: opt.id },
        data: { text: newTexts[idx], isCorrect: labels[idx] === parsed.data.correctOption },
      })
    ),
  ]);

  revalidatePath(`/admin/papers/${paperId}`);
  redirect(`/admin/papers/${paperId}`);
}

/** Soft-delete only — a question may already have real Answers against it,
 * and isActive is exactly the flag question-serving already respects. */
export async function toggleQuestionActiveAction(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;

  const questionId = String(formData.get("questionId") ?? "");
  const paperId = String(formData.get("paperId") ?? "");
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return;

  await prisma.question.update({ where: { id: questionId }, data: { isActive: !question.isActive } });
  revalidatePath(`/admin/papers/${paperId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/adminSession";
import { prisma } from "@/lib/prisma";

export type ExamActionState = { error?: string } | undefined;

const optionalText = (max: number) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(max).optional());

const ExamSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers and hyphens"),
  board: optionalText(40),
  shortName: optionalText(40),
  description: optionalText(500),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
});

function parseExam(formData: FormData) {
  return ExamSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    board: formData.get("board"),
    shortName: formData.get("shortName"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
}

export async function createExamAction(
  _prev: ExamActionState,
  formData: FormData
): Promise<ExamActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const parsed = parseExam(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await prisma.exam.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "An exam with this slug already exists." };

  const d = parsed.data;
  await prisma.exam.create({
    data: {
      name: d.name,
      slug: d.slug,
      board: d.board ?? null,
      shortName: d.shortName ?? null,
      description: d.description ?? null,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    },
  });
  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}

export async function updateExamAction(
  _prev: ExamActionState,
  formData: FormData
): Promise<ExamActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing exam id." };

  const parsed = parseExam(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const clash = await prisma.exam.findUnique({ where: { slug: parsed.data.slug } });
  if (clash && clash.id !== id) return { error: "Another exam already uses this slug." };

  const d = parsed.data;
  await prisma.exam.update({
    where: { id },
    data: {
      name: d.name,
      slug: d.slug,
      board: d.board ?? null,
      shortName: d.shortName ?? null,
      description: d.description ?? null,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    },
  });
  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${id}`);
  redirect("/admin/exams");
}

export async function toggleExamActiveAction(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam) return;
  await prisma.exam.update({ where: { id }, data: { isActive: !exam.isActive } });
  revalidatePath("/admin/exams");
}

// ---- Sections (an exam's blueprint taxonomy) ----

const SectionSchema = z.object({
  examId: z.string().min(1),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(30)
    .regex(/^[A-Z0-9_]+$/, "code must be UPPERCASE letters, numbers and underscores"),
  nameEn: z.string().trim().min(1).max(80),
  nameHi: z.string().trim().min(1).max(80),
  sortOrder: z.coerce.number().int(),
});

export type SectionActionState = { error?: string } | undefined;

export async function createSectionAction(
  _prev: SectionActionState,
  formData: FormData
): Promise<SectionActionState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized." };

  const parsed = SectionSchema.safeParse({
    examId: formData.get("examId"),
    code: formData.get("code"),
    nameEn: formData.get("nameEn"),
    nameHi: formData.get("nameHi"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const dup = await prisma.section.findUnique({
    where: { examId_code: { examId: parsed.data.examId, code: parsed.data.code } },
  });
  if (dup) return { error: "This exam already has a section with that code." };

  await prisma.section.create({ data: parsed.data });
  revalidatePath(`/admin/exams/${parsed.data.examId}`);
  redirect(`/admin/exams/${parsed.data.examId}`);
}

export async function deleteSectionAction(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) return;
  const id = String(formData.get("id") ?? "");
  const section = await prisma.section.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  });
  // Refuse to delete a section that still has questions — would orphan them.
  if (!section || section._count.questions > 0) return;
  await prisma.section.delete({ where: { id } });
  revalidatePath(`/admin/exams/${section.examId}`);
}

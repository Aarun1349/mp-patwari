"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/adminSession";
import { parseAndImportQuestions, type RowError } from "@/lib/exam/importQuestions";
import { getDefaultExamId } from "@/lib/exam/defaultExam";
import { prisma } from "@/lib/prisma";

export type UploadActionState =
  | {
      success: true;
      rowCount: number;
      successCount: number;
      errorCount: number;
      errors: RowError[];
      paperTitle: string;
      paperId: string;
    }
  | { error: string }
  | undefined;

const NewPaperSchema = z.object({
  title: z.string().trim().min(1),
  isFree: z.boolean(),
  durationMinutes: z.coerce.number().int().positive(),
  totalQuestions: z.coerce.number().int().positive(),
  totalMarks: z.coerce.number().int().positive(),
  negativeMarkingRatio: z.coerce.number().min(0).max(1),
});

export async function uploadQuestionsAction(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const adminSession = await getAdminSession();
  if (!adminSession) return { error: "Not authorized. Please sign in again." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a spreadsheet file to upload." };
  }
  const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "File is too large. Please upload a spreadsheet under 2MB." };
  }

  const paperMode = formData.get("paperMode");
  let paperId: string;
  let paperTitle: string;

  if (paperMode === "existing") {
    const existingPaperId = String(formData.get("existingPaperId") ?? "");
    if (!existingPaperId) return { error: "Choose an existing paper." };
    const paper = await prisma.paper.findUnique({ where: { id: existingPaperId }, select: { id: true, title: true } });
    if (!paper) return { error: "That paper no longer exists." };
    paperId = paper.id;
    paperTitle = paper.title;
  } else {
    const parsed = NewPaperSchema.safeParse({
      title: formData.get("title"),
      isFree: formData.get("isFree") === "on",
      durationMinutes: formData.get("durationMinutes"),
      totalQuestions: formData.get("totalQuestions"),
      totalMarks: formData.get("totalMarks"),
      negativeMarkingRatio: formData.get("negativeMarkingRatio"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid paper details." };
    }

    // The exam the new paper belongs to — chosen in the form, else the active exam.
    const examId = String(formData.get("examId") ?? "") || (await getDefaultExamId());
    const maxSequence = await prisma.paper.aggregate({ _max: { sequenceNo: true } });
    const paper = await prisma.paper.create({
      data: {
        ...parsed.data,
        sequenceNo: (maxSequence._max.sequenceNo ?? 0) + 1,
        examId,
      },
    });
    paperId = paper.id;
    paperTitle = paper.title;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let result;
  try {
    result = await parseAndImportQuestions(buffer, paperId, adminSession.adminUserId, file.name);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Import failed." };
  }

  revalidatePath("/admin/upload");
  return { success: true, paperId, paperTitle, ...result };
}

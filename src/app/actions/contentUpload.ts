"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseAndImportQuestions, type RowError } from "@/lib/exam/importQuestions";
import { getDefaultExamId } from "@/lib/exam/defaultExam";
import { prisma } from "@/lib/prisma";
import { checkPermission, canActOnTenant, actorTenantId, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

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
  durationMinutes: z.coerce.number().int().positive().max(180, "Duration can't exceed 180 minutes."),
  totalQuestions: z.coerce.number().int().positive().max(300, "Total questions can't exceed 300."),
  totalMarks: z.coerce.number().int().positive(),
  negativeMarkingRatio: z.coerce.number().min(0).max(0.5, "Negative marking ratio can't exceed 0.50."),
});

export async function uploadQuestionsAction(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const gate = await checkPermission(PERMISSIONS.QUESTION_MANAGE_OWN);
  if ("error" in gate) return gate;

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
    const paper = await prisma.paper.findUnique({
      where: { id: existingPaperId },
      select: { id: true, title: true, tenantId: true },
    });
    if (!paper) return { error: "That paper no longer exists." };
    if (!canActOnTenant(gate, paper.tenantId)) return { error: "That paper belongs to another tenant." };
    paperId = paper.id;
    paperTitle = paper.title;
  } else {
    // Creating a NEW paper (not just adding questions to one) needs paper mgmt.
    if (!hasPermission(gate.adminUser, PERMISSIONS.PAPER_MANAGE_OWN)) {
      return { error: "You don't have permission to create a new paper." };
    }
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
        tenantId: actorTenantId(gate),
      },
    });
    paperId = paper.id;
    paperTitle = paper.title;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let result;
  try {
    result = await parseAndImportQuestions(buffer, paperId, gate.adminUserId, file.name);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Import failed." };
  }

  revalidatePath("/admin/upload");
  revalidatePath(`/admin/papers/${paperId}`);

  // Clean import (no bad rows) → take the admin straight to the paper's questions
  // to review what imported. A partial import stays on the form so the per-row
  // error report is visible for fixing + re-upload (valid rows already saved).
  if (result.errorCount === 0) {
    redirect(`/admin/papers/${paperId}?uploaded=${result.successCount}`);
  }

  return { success: true, paperId, paperTitle, ...result };
}

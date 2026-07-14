import "server-only";
import * as XLSX from "xlsx";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const MAX_ROWS = 500;

const optionalNonNegativeNumber = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return undefined;
  const num = typeof val === "number" ? val : Number(val);
  return Number.isFinite(num) ? num : val;
}, z.number().min(0, "must be non-negative").optional());

const RowSchema = z
  .object({
    section_code: z.string().trim().min(1, "section_code is required"),
    question_text: z.string().trim().min(1, "question_text is required"),
    option_a: z.string().trim().min(1, "option_a is required"),
    option_b: z.string().trim().min(1, "option_b is required"),
    option_c: z.string().trim().min(1, "option_c is required"),
    option_d: z.string().trim().min(1, "option_d is required"),
    correct_option: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => ["A", "B", "C", "D"].includes(v), "correct_option must be A, B, C, or D"),
    marks: optionalNonNegativeNumber,
    negative_marks: optionalNonNegativeNumber,
  })
  .refine(
    (row) => {
      const options = [row.option_a, row.option_b, row.option_c, row.option_d].map((o) =>
        o.trim().toLowerCase()
      );
      return new Set(options).size === options.length;
    },
    { message: "the four options must be distinct" }
  );

export interface RowError {
  row: number;
  message: string;
}

export interface ImportResult {
  rowCount: number;
  successCount: number;
  errorCount: number;
  errors: RowError[];
}

const OPTION_KEYS = ["a", "b", "c", "d"] as const;

function normalizeQuestionText(text: string): string {
  return text.trim().toLowerCase();
}

export async function parseAndImportQuestions(
  buffer: Buffer,
  paperId: string,
  uploadedById: string,
  filename: string
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });

  if (rows.length > MAX_ROWS) {
    throw new Error(`Spreadsheet has ${rows.length} rows, which exceeds the ${MAX_ROWS}-row limit per upload.`);
  }

  // Fetch the paper first so section codes are validated against THIS paper's
  // exam only — a section code from another exam must not match.
  const paper = await prisma.paper.findUniqueOrThrow({ where: { id: paperId } });
  const [sections, existingQuestions] = await Promise.all([
    prisma.section.findMany({ where: { examId: paper.examId } }),
    prisma.question.findMany({ where: { paperId }, select: { text: true } }),
  ]);
  const sectionIdByCode = new Map(sections.map((s) => [s.code, s.id]));
  const seenQuestionTexts = new Set(existingQuestions.map((q) => normalizeQuestionText(q.text)));

  const upload = await prisma.contentUpload.create({
    data: {
      uploadedById,
      paperId,
      filename,
      rowCount: rows.length,
      successCount: 0,
      errorCount: 0,
    },
  });

  const errors: RowError[] = [];
  let successCount = 0;

  for (const [i, raw] of rows.entries()) {
    const rowNumber = i + 2; // +1 for header row, +1 for 1-indexing
    const parsed = RowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ row: rowNumber, message: parsed.error.issues[0]?.message ?? "Invalid row" });
      continue;
    }

    const sectionId = sectionIdByCode.get(parsed.data.section_code);
    if (!sectionId) {
      errors.push({ row: rowNumber, message: `Unknown section_code: ${parsed.data.section_code}` });
      continue;
    }

    const normalizedText = normalizeQuestionText(parsed.data.question_text);
    if (seenQuestionTexts.has(normalizedText)) {
      errors.push({ row: rowNumber, message: "duplicate question (already exists for this paper)" });
      continue;
    }
    seenQuestionTexts.add(normalizedText);

    const marks = parsed.data.marks ?? 1;
    const negativeMarks = parsed.data.negative_marks ?? paper.negativeMarkingRatio * marks;

    await prisma.question.create({
      data: {
        paperId,
        sectionId,
        text: parsed.data.question_text,
        marks,
        negativeMarks,
        sourceUploadId: upload.id,
        options: {
          create: OPTION_KEYS.map((key, idx) => ({
            label: key.toUpperCase(),
            text: parsed.data[`option_${key}` as const],
            isCorrect: parsed.data.correct_option === key.toUpperCase(),
            sortOrder: idx,
          })),
        },
      },
    });
    successCount++;
  }

  await prisma.contentUpload.update({
    where: { id: upload.id },
    data: { successCount, errorCount: errors.length, errors: errors as unknown as Prisma.InputJsonValue },
  });

  return { rowCount: rows.length, successCount, errorCount: errors.length, errors };
}

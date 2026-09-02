import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAdminSession } from "@/lib/auth/adminSession";
import { prisma } from "@/lib/prisma";

/**
 * Downloads a ready-to-fill question-upload template (.xlsx) for an exam:
 * - "Questions" sheet with the exact header columns the importer expects + a
 *   couple of worked example rows.
 * - "Sections (valid codes)" sheet listing that exam's section codes, so the
 *   uploader knows which section_code values are accepted.
 */
export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const examId = new URL(req.url).searchParams.get("examId");

  const [exam, sections] = await Promise.all([
    examId ? prisma.exam.findUnique({ where: { id: examId }, select: { name: true, slug: true } }) : Promise.resolve(null),
    examId
      ? prisma.section.findMany({
          where: { examId },
          orderBy: { sortOrder: "asc" },
          select: { code: true, nameEn: true, nameHi: true },
        })
      : Promise.resolve([]),
  ]);

  // No marks / negative_marks columns: scoring is DERIVED from the paper
  // (total marks ÷ questions, and the paper's negative-marking ratio), so any
  // per-question values in the sheet are ignored by the importer. Leaving them
  // out keeps the template honest — e.g. a no-negative-marking exam like MP SI
  // never implies a per-question penalty.
  const header = [
    "section_code",
    "question_text",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_option",
  ];
  const exampleCode = sections[0]?.code ?? "GK";
  const questionRows: (string | number)[][] = [
    header,
    [exampleCode, "What is the capital of Madhya Pradesh?", "Indore", "Bhopal", "Gwalior", "Jabalpur", "B"],
    [exampleCode, "Which river flows through Bhopal region?", "Narmada", "Betwa", "Chambal", "Tapti", "A"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(questionRows);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 52 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");

  const sectionRows: string[][] = [["section_code", "Name (EN)", "Name (HI)"]];
  if (sections.length === 0) {
    sectionRows.push(["(no sections yet — add them in Admin → Exams)", "", ""]);
  } else {
    for (const s of sections) sectionRows.push([s.code, s.nameEn, s.nameHi]);
  }
  const secWs = XLSX.utils.aoa_to_sheet(sectionRows);
  secWs["!cols"] = [{ wch: 22 }, { wch: 32 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, secWs, "Sections (valid codes)");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filename = exam ? `${exam.slug}-questions-template.xlsx` : "questions-template.xlsx";

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

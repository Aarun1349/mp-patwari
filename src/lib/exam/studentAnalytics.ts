import "server-only";
import { prisma } from "@/lib/prisma";

const TERMINAL = ["submitted", "expired", "locked"] as const;

export interface SectionWeaknessRow {
  code: string;
  nameEn: string;
  totalQuestions: number; // questions faced across all the student's attempts
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracyPct: number; // correct / attempted
  marksLost: number; // negative marks incurred here
}

export interface StudentWeakness {
  attemptCount: number;
  rows: SectionWeaknessRow[]; // weakest (lowest accuracy) first
}

/**
 * Aggregates a student's SECTION-level performance across every terminal attempt —
 * the teacher-facing "where is this student actually weak" x-ray that a plain
 * score list can't give. Grouped by section code so the same subject across
 * multiple mocks/attempts rolls up into one honest picture.
 */
export async function getStudentSectionWeakness(userId: string): Promise<StudentWeakness> {
  const attempts = await prisma.attempt.findMany({
    where: { userId, status: { in: [...TERMINAL] } },
    select: { id: true, paperId: true },
  });
  if (attempts.length === 0) return { attemptCount: 0, rows: [] };

  const paperIds = [...new Set(attempts.map((a) => a.paperId))];
  const attemptIds = attempts.map((a) => a.id);

  const [questions, answers] = await Promise.all([
    prisma.question.findMany({
      where: { paperId: { in: paperIds }, isActive: true },
      select: {
        id: true,
        paperId: true,
        negativeMarks: true,
        section: { select: { code: true, nameEn: true, sortOrder: true } },
        options: { where: { isCorrect: true }, select: { id: true }, take: 1 },
      },
    }),
    prisma.answer.findMany({
      where: { attemptId: { in: attemptIds } },
      select: { attemptId: true, questionId: true, selectedOptionId: true },
    }),
  ]);

  const questionsByPaper = new Map<string, typeof questions>();
  for (const q of questions) {
    const list = questionsByPaper.get(q.paperId) ?? [];
    list.push(q);
    questionsByPaper.set(q.paperId, list);
  }
  const selectedByKey = new Map(answers.map((a) => [`${a.attemptId}:${a.questionId}`, a.selectedOptionId]));

  type Acc = SectionWeaknessRow & { sortOrder: number };
  const bySection = new Map<string, Acc>();

  for (const attempt of attempts) {
    for (const q of questionsByPaper.get(attempt.paperId) ?? []) {
      let row = bySection.get(q.section.code);
      if (!row) {
        row = {
          code: q.section.code,
          nameEn: q.section.nameEn,
          totalQuestions: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          accuracyPct: 0,
          marksLost: 0,
          sortOrder: q.section.sortOrder,
        };
        bySection.set(q.section.code, row);
      }
      row.totalQuestions++;
      const selected = selectedByKey.get(`${attempt.id}:${q.id}`) ?? null;
      if (!selected) {
        row.skipped++;
        continue;
      }
      row.attempted++;
      if (selected === q.options[0]?.id) row.correct++;
      else {
        row.incorrect++;
        row.marksLost += q.negativeMarks;
      }
    }
  }

  const rows = [...bySection.values()]
    .map((r) => ({ ...r, accuracyPct: r.attempted ? Math.round((r.correct / r.attempted) * 100) : 0 }))
    // Weakest first: lowest accuracy, then most marks lost — that's what a teacher wants to see up top.
    .sort((a, b) => a.accuracyPct - b.accuracyPct || b.marksLost - a.marksLost)
    .map(({ sortOrder: _sortOrder, ...r }) => r);

  return { attemptCount: attempts.length, rows };
}

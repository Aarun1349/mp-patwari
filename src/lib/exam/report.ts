export interface ReportQuestion {
  id: string;
  sectionId: string;
  marks: number;
  negativeMarks: number;
  correctOptionId: string | null;
  section: { code: string; nameEn: string; sortOrder: number };
}

export interface ReportAnswer {
  questionId: string;
  selectedOptionId: string | null;
}

export interface SectionReportRow {
  sectionId: string;
  code: string;
  nameEn: string;
  totalQuestions: number;
  maxMarks: number;
  attempted: number;
  correct: number;
  incorrect: number;
  marksScored: number;
}

export function buildSectionReport(
  questions: ReportQuestion[],
  answers: ReportAnswer[]
): SectionReportRow[] {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));
  const bySection = new Map<string, SectionReportRow & { sortOrder: number }>();

  for (const q of questions) {
    let row = bySection.get(q.sectionId);
    if (!row) {
      row = {
        sectionId: q.sectionId,
        code: q.section.code,
        nameEn: q.section.nameEn,
        totalQuestions: 0,
        maxMarks: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        marksScored: 0,
        sortOrder: q.section.sortOrder,
      };
      bySection.set(q.sectionId, row);
    }

    row.totalQuestions++;
    row.maxMarks += q.marks;

    const answer = answerByQuestion.get(q.id);
    if (!answer?.selectedOptionId) continue;

    row.attempted++;
    if (answer.selectedOptionId === q.correctOptionId) {
      row.correct++;
      row.marksScored += q.marks;
    } else {
      row.incorrect++;
      row.marksScored -= q.negativeMarks;
    }
  }

  return [...bySection.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

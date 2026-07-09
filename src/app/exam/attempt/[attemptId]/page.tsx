import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ExamRoom } from "./ExamRoom";

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const { userId } = await verifySession();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { paper: true },
  });

  if (!attempt || attempt.userId !== userId) notFound();

  if (["submitted", "expired", "locked"].includes(attempt.status)) {
    redirect(`/exam/result/${attemptId}`);
  }

  const questionOrder = attempt.questionOrder as string[];
  const totalQuestions = questionOrder.length;
  const remainingSeconds = Math.max(0, Math.floor((attempt.endsAt.getTime() - Date.now()) / 1000));

  // Section-per-index breakdown for this attempt's shuffled order — only
  // section labels, never question text/options, so this doesn't touch the
  // anti-scraping boundary (that's about the question bank, not subject names).
  const questions = await prisma.question.findMany({
    where: { id: { in: questionOrder } },
    select: { id: true, section: { select: { code: true, nameEn: true, nameHi: true } } },
  });
  const sectionByQuestionId = new Map(questions.map((q) => [q.id, q.section]));

  const sections: { code: string; nameEn: string; nameHi: string; indices: number[] }[] = [];
  const sectionIndexByCode = new Map<string, number>();
  questionOrder.forEach((questionId, index) => {
    const section = sectionByQuestionId.get(questionId);
    if (!section) return;
    let sectionIndex = sectionIndexByCode.get(section.code);
    if (sectionIndex === undefined) {
      sectionIndex = sections.length;
      sectionIndexByCode.set(section.code, sectionIndex);
      sections.push({ ...section, indices: [] });
    }
    sections[sectionIndex].indices.push(index);
  });

  return (
    <ExamRoom
      attemptId={attempt.id}
      paperTitle={attempt.paper.title}
      totalQuestions={totalQuestions}
      initialRemainingSeconds={remainingSeconds}
      sections={sections}
    />
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateQuestionAction } from "@/app/actions/adminPapers";
import { QuestionForm } from "../../QuestionForm";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ paperId: string; questionId: string }>;
}) {
  const { paperId, questionId } = await params;

  const [question, sections] = await Promise.all([
    prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.section.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!question || question.paperId !== paperId) notFound();

  const [a, b, c, d] = question.options;
  const correctOption = (["A", "B", "C", "D"] as const)[question.options.findIndex((o) => o.isCorrect)] ?? "A";

  return (
    <div className="auth-card" style={{ maxWidth: "560px" }}>
      <h1>Edit Question</h1>
      <QuestionForm
        action={updateQuestionAction}
        paperId={paperId}
        sections={sections}
        defaults={{
          questionId: question.id,
          sectionId: question.sectionId,
          text: question.text,
          optionA: a?.text ?? "",
          optionB: b?.text ?? "",
          optionC: c?.text ?? "",
          optionD: d?.text ?? "",
          correctOption,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
        }}
      />
    </div>
  );
}

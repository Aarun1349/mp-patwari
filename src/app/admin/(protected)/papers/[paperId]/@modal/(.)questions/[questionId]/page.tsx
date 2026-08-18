import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateQuestionAction } from "@/app/actions/adminPapers";
import { QuestionForm } from "../../../QuestionForm";
import { Modal } from "@/components/ui/Modal";

// Intercepts a soft navigation to /admin/papers/[paperId]/questions/[questionId]
// and shows the edit form in a modal over the paper page. On save,
// updateQuestionAction redirects back to the paper page, which closes the modal.
export default async function EditQuestionModal({
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
    <Modal title="Edit Question">
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
        }}
      />
    </Modal>
  );
}

import { prisma } from "@/lib/prisma";
import { createQuestionAction } from "@/app/actions/adminPapers";
import { QuestionForm } from "../../QuestionForm";

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  const sections = await prisma.section.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="auth-card" style={{ maxWidth: "560px" }}>
      <a href={`/admin/papers/${paperId}`} style={{ fontSize: "13px", display: "inline-block", marginBottom: "10px" }}>
        ← Back to paper
      </a>
      <h1>Add Question</h1>
      <QuestionForm action={createQuestionAction} paperId={paperId} sections={sections} />
    </div>
  );
}

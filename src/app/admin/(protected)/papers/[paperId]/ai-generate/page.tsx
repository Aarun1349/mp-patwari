import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AiGenerateForm } from "./AiGenerateForm";

export default async function AiGenerateQuestionsPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  const [paper, sections] = await Promise.all([
    prisma.paper.findUnique({ where: { id: paperId } }),
    prisma.section.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!paper) notFound();

  return (
    <div className="auth-card auth-card-wide">
      <h1>AI-Generate Questions — {paper.title}</h1>
      <p className="muted">
        Generated questions are never saved automatically — you review, edit, and select which ones to
        keep before anything is added to the paper.
      </p>
      <AiGenerateForm paperId={paperId} sections={sections} />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { togglePaperActiveAction, toggleQuestionActiveAction } from "@/app/actions/adminPapers";
import { PaperEditForm } from "./PaperEditForm";

export default async function AdminPaperDetailPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  const paper = await prisma.paper.findUnique({ where: { id: paperId } });
  if (!paper) notFound();

  const questions = await prisma.question.findMany({
    where: { paperId },
    include: { section: { select: { nameEn: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <div className="auth-card" style={{ maxWidth: "480px" }}>
        <h1>{paper.title}</h1>
        <PaperEditForm paper={paper} />
        <form action={togglePaperActiveAction} style={{ marginTop: "12px" }}>
          <input type="hidden" name="id" value={paper.id} />
          <button type="submit">{paper.isActive ? "Deactivate paper" : "Activate paper"}</button>
        </form>
      </div>

      <div className="auth-card auth-card-wide" style={{ marginTop: "20px" }}>
        <h2>Questions ({questions.length})</h2>
        <p className="muted">
          <Link href={`/admin/papers/${paper.id}/questions/new`}>+ Add a question manually</Link>
          {" · "}
          <Link href="/admin/upload">Bulk-upload via spreadsheet</Link>
        </p>

        <table className="report-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Question</th>
              <th>Marks</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} style={!q.isActive ? { opacity: 0.5 } : undefined}>
                <td>{q.section.nameEn}</td>
                <td style={{ maxWidth: "420px" }}>{q.text}</td>
                <td>{q.marks}</td>
                <td>{q.isActive ? "Yes" : "No"}</td>
                <td>
                  <Link href={`/admin/papers/${paper.id}/questions/${q.id}`}>Edit</Link>
                  {" · "}
                  <form action={toggleQuestionActiveAction} style={{ display: "inline" }}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="paperId" value={paper.id} />
                    <button type="submit" style={{ fontSize: "12px", padding: "2px 6px" }}>
                      {q.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

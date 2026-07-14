import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  togglePaperActiveAction,
  toggleQuestionActiveAction,
  pretranslatePaperAction,
} from "@/app/actions/adminPapers";
import { NON_TRANSLATABLE_SECTION_CODES } from "@/lib/ai/translate";
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
    include: {
      section: { select: { nameEn: true, code: true } },
      options: { select: { textAlt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // How many active, translatable questions still lack a cached Hindi (alt)
  // translation — the exam toggle is only instant once this reaches 0.
  const pendingTranslation = questions.filter(
    (q) =>
      q.isActive &&
      !NON_TRANSLATABLE_SECTION_CODES.has(q.section.code) &&
      (q.textAlt == null || q.options.some((o) => o.textAlt == null))
  ).length;

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
          <Link href={`/admin/papers/${paper.id}/ai-generate`}>+ Generate with AI</Link>
          {" · "}
          <Link href="/admin/upload">Bulk-upload via spreadsheet</Link>
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            margin: "4px 0 18px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: pendingTranslation > 0 ? "rgba(201,162,39,0.1)" : "rgba(31,122,61,0.08)",
            border: `1px solid ${pendingTranslation > 0 ? "rgba(201,162,39,0.3)" : "rgba(31,122,61,0.25)"}`,
          }}
        >
          <span style={{ fontSize: "13px", color: "#1a2a44" }}>
            {pendingTranslation > 0
              ? `Hindi translation: ${pendingTranslation} question(s) pending — the exam language toggle is instant only once this is 0.`
              : "Hindi translation: all questions cached ✓ — language toggle is instant."}
          </span>
          {pendingTranslation > 0 && (
            <form action={pretranslatePaperAction} style={{ marginLeft: "auto" }}>
              <input type="hidden" name="paperId" value={paper.id} />
              <button type="submit">Pre-translate next batch (up to 20)</button>
            </form>
          )}
        </div>

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

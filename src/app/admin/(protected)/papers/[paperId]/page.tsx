import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  togglePaperActiveAction,
  toggleQuestionActiveAction,
  pretranslatePaperAction,
} from "@/app/actions/adminPapers";
import { NON_TRANSLATABLE_SECTION_CODES } from "@/lib/ai/translate";
import { requirePagePermission, canActOnTenant, PERMISSIONS } from "@/lib/auth/permissions";
import { PaperEditForm } from "./PaperEditForm";

/** Page numbers to show, with ellipsis when there are many pages. */
function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  if (current > 3) out.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) out.push(p);
  if (current < total - 2) out.push("…");
  out.push(total);
  return out;
}

export default async function AdminPaperDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ paperId: string }>;
  searchParams: Promise<{ uploaded?: string; page?: string }>;
}) {
  const { paperId } = await params;
  const { uploaded, page: pageParam } = await searchParams;
  const session = await requirePagePermission(PERMISSIONS.QUESTION_MANAGE_OWN);

  const paper = await prisma.paper.findUnique({ where: { id: paperId } });
  // notFound (not a redirect) for a cross-tenant paper — don't reveal it exists.
  if (!paper || !canActOnTenant(session, paper.tenantId)) notFound();

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

  // Paginate the questions list — 10 per page.
  const PAGE_SIZE = 10; // questions per page
  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(pageParam) || 1));
  const pageQuestions = questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="paper-detail">
      <aside className="paper-detail__side">
        <div className="auth-card">
          <h1>{paper.title}</h1>
          <PaperEditForm paper={paper} />
          <form action={togglePaperActiveAction} style={{ marginTop: "12px" }}>
            <input type="hidden" name="id" value={paper.id} />
            <button type="submit" className={paper.isActive ? "btn-danger" : "btn-secondary"}>
              {paper.isActive ? "Deactivate paper" : "Activate paper"}
            </button>
          </form>
        </div>
      </aside>

      <div className="paper-detail__main">
        <div className="auth-card">
          <h2>Questions ({questions.length})</h2>
        {uploaded && (
          <p className="auth-success" style={{ margin: "4px 0 10px" }}>
            ✓ {uploaded} question(s) uploaded successfully.
          </p>
        )}
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
            {pageQuestions.map((q) => (
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

        {totalPages > 1 && (
          <div className="ee-pagination">
            {page > 1 ? (
              <Link href={`/admin/papers/${paper.id}?page=${page - 1}`} className="ee-page-btn">
                ← Prev
              </Link>
            ) : (
              <span className="ee-page-btn disabled">← Prev</span>
            )}
            {pageNumbers(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="ee-page-ellipsis">
                  …
                </span>
              ) : p === page ? (
                <span key={p} className="ee-page-btn active">
                  {p}
                </span>
              ) : (
                <Link key={p} href={`/admin/papers/${paper.id}?page=${p}`} className="ee-page-btn">
                  {p}
                </Link>
              )
            )}
            {page < totalPages ? (
              <Link href={`/admin/papers/${paper.id}?page=${page + 1}`} className="ee-page-btn">
                Next →
              </Link>
            ) : (
              <span className="ee-page-btn disabled">Next →</span>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

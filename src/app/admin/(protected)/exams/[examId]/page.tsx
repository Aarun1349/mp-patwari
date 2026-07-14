import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { updateExamAction, deleteSectionAction } from "@/app/actions/adminExams";
import { ExamForm } from "../ExamForm";
import { AddSectionForm } from "../AddSectionForm";

export default async function EditExamPage({ params }: { params: Promise<{ examId: string }> }) {
  await verifyAdminSession();
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) notFound();

  const sections = await prisma.section.findMany({
    where: { examId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { questions: true } } },
  });

  const nextSortOrder = sections.length ? Math.max(...sections.map((s) => s.sortOrder)) + 1 : 1;

  return (
    <>
      <div className="auth-card" style={{ maxWidth: "520px" }}>
        <h1>Edit Exam</h1>
        <ExamForm action={updateExamAction} exam={exam} />
      </div>

      <div className="auth-card auth-card-wide" style={{ marginTop: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Sections ({sections.length})</h2>
        <p className="page-subtitle">
          The exam&apos;s subject taxonomy — questions are tagged to a section, and papers/results break down by them.
        </p>

        {sections.length === 0 && <p className="muted">No sections yet — add the first one below.</p>}

        {sections.length > 0 && (
          <table className="report-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Code</th>
                <th>Name (EN)</th>
                <th>Name (HI)</th>
                <th>Questions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.id}>
                  <td>{s.sortOrder}</td>
                  <td className="mono">{s.code}</td>
                  <td>{s.nameEn}</td>
                  <td>{s.nameHi}</td>
                  <td>{s._count.questions}</td>
                  <td>
                    {s._count.questions === 0 ? (
                      <form action={deleteSectionAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="btn-sm btn-danger">
                          Delete
                        </button>
                      </form>
                    ) : (
                      <span style={{ color: "#8a8372", fontSize: "12px" }}>has questions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <AddSectionForm examId={exam.id} nextSortOrder={nextSortOrder} />
      </div>
    </>
  );
}

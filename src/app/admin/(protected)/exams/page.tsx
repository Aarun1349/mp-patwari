import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { toggleExamActiveAction } from "@/app/actions/adminExams";

export default async function AdminExamsPage() {
  await verifyAdminSession();

  const exams = await prisma.exam.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { sections: true, packages: true } },
      papers: { where: { isActive: true }, select: { id: true } },
    },
  });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Exams</h1>
      <p className="page-subtitle">
        Each exam has its own sections, papers, packages and credits. An exam goes “Live” on the landing page once it
        has at least one active paper.
      </p>

      <div className="admin-toolbar">
        <Link href="/admin/exams/new" className="btn">
          + Create exam
        </Link>
        <span className="toolbar-note toolbar-spacer">{exams.length} exam(s)</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="report-table">
          <thead>
            <tr>
              <th>Exam</th>
              <th>Board</th>
              <th>Sections</th>
              <th>Active papers</th>
              <th>Packages</th>
              <th>Status</th>
              <th>Listed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => {
              const live = exam.papers.length > 0;
              return (
                <tr key={exam.id}>
                  <td style={{ fontWeight: 600, color: "#1a2a44" }}>{exam.name}</td>
                  <td className="mono">{exam.board ?? "—"}</td>
                  <td>{exam._count.sections}</td>
                  <td>{exam.papers.length}</td>
                  <td>{exam._count.packages}</td>
                  <td>
                    <span className={`status-badge ${live ? "status-good" : "status-neutral"}`}>
                      {live ? "Live" : "Coming soon"}
                    </span>
                  </td>
                  <td>{exam.isActive ? "Yes" : "No"}</td>
                  <td>
                    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <Link href={`/admin/exams/${exam.id}`}>Edit</Link>
                      <form action={toggleExamActiveAction}>
                        <input type="hidden" name="id" value={exam.id} />
                        <button type="submit" className={`btn-sm ${exam.isActive ? "btn-danger" : "btn-secondary"}`}>
                          {exam.isActive ? "Unlist" : "List"}
                        </button>
                      </form>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

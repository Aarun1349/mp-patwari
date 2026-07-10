import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPapersPage() {
  const papers = await prisma.paper.findMany({
    orderBy: { sequenceNo: "asc" },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Papers &amp; Questions</h1>
      <p className="muted">
        Create new papers via <Link href="/admin/upload">Upload Questions</Link>. Edit metadata or
        individual questions here.
      </p>

      <table className="report-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Free</th>
            <th>Questions</th>
            <th>Attempts</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {papers.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.isFree ? "Yes" : "No"}</td>
              <td>{p._count.questions}</td>
              <td>{p._count.attempts}</td>
              <td>{p.isActive ? "Yes" : "No"}</td>
              <td>
                <Link href={`/admin/papers/${p.id}`}>Manage</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

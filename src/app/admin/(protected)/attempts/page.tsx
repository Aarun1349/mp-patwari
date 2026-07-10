import { prisma } from "@/lib/prisma";

export default async function AdminAttemptsPage({
  searchParams,
}: {
  searchParams: Promise<{ flagged?: string }>;
}) {
  const { flagged } = await searchParams;
  const onlyFlagged = flagged === "1";

  const attempts = await prisma.attempt.findMany({
    where: onlyFlagged ? { flagged: true } : undefined,
    include: {
      user: { select: { phone: true, email: true } },
      paper: { select: { title: true, totalMarks: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  return (
    <div className="auth-card auth-card-wide">
      <h1>Attempts</h1>
      <p className="muted">
        {onlyFlagged ? (
          <a href="/admin/attempts">Show all attempts</a>
        ) : (
          <a href="/admin/attempts?flagged=1">Show only flagged attempts</a>
        )}
      </p>

      <table className="report-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Paper</th>
            <th>Status</th>
            <th>Score</th>
            <th>Fullscreen exits</th>
            <th>Flagged</th>
            <th>Started</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} style={a.flagged ? { background: "rgba(163,36,42,0.06)" } : undefined}>
              <td>{a.user.phone ?? a.user.email ?? "—"}</td>
              <td>{a.paper.title}</td>
              <td>{a.status}</td>
              <td>{a.totalScore != null ? `${a.totalScore}/${a.paper.totalMarks}` : "—"}</td>
              <td>{a.fullscreenExitCount}</td>
              <td>{a.flagged ? "Yes" : "No"}</td>
              <td>{a.startedAt.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

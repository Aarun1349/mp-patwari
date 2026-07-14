import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { Pagination } from "../Pagination";

const PAGE_SIZE = 25;

const STATUS_BADGE: Record<string, string> = {
  submitted: "status-good",
  locked: "status-bad",
  expired: "status-neutral",
  in_progress: "status-pending",
  paused: "status-pending",
};

export default async function AdminAttemptsPage({
  searchParams,
}: {
  searchParams: Promise<{ flagged?: string; q?: string; page?: string }>;
}) {
  await verifyAdminSession();
  const { flagged, q, page: pageParam } = await searchParams;
  const onlyFlagged = flagged === "1";
  const query = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam) || 1);

  const where = {
    ...(onlyFlagged ? { flagged: true } : {}),
    ...(query
      ? {
          user: {
            OR: [
              { phone: { contains: query } },
              { email: { contains: query, mode: "insensitive" as const } },
              { name: { contains: query, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [attempts, total] = await Promise.all([
    prisma.attempt.findMany({
      where,
      include: {
        user: { select: { phone: true, email: true, name: true } },
        paper: { select: { title: true, totalMarks: true } },
      },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.attempt.count({ where }),
  ]);

  // Preserve the search term when toggling the flagged filter.
  const qParam = query ? `&q=${encodeURIComponent(query)}` : "";

  return (
    <div className="auth-card auth-card-wide">
      <h1>Attempts</h1>
      <p className="page-subtitle">Every exam attempt, with integrity flags and scores.</p>

      <div className="admin-toolbar">
        <form method="get" className="admin-search">
          {onlyFlagged && <input type="hidden" name="flagged" value="1" />}
          <input type="text" name="q" placeholder="Search by user (phone, email, name)" defaultValue={query} />
          <button type="submit">Search</button>
          {query && (
            <a className="btn btn-secondary" href={onlyFlagged ? "/admin/attempts?flagged=1" : "/admin/attempts"}>
              Clear
            </a>
          )}
        </form>

        <a className={`filter-pill${!onlyFlagged ? " active" : ""}`} href={`/admin/attempts?${qParam.slice(1)}`}>
          All
        </a>
        <a className={`filter-pill${onlyFlagged ? " active" : ""}`} href={`/admin/attempts?flagged=1${qParam}`}>
          Flagged only
        </a>

        <span className="toolbar-note toolbar-spacer">
          {total.toLocaleString("en-IN")} attempt(s){query ? " matching" : ""}
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
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
                <td>{a.user.name ?? a.user.phone ?? a.user.email ?? "—"}</td>
                <td>{a.paper.title}</td>
                <td>
                  <span className={`status-badge ${STATUS_BADGE[a.status] ?? "status-neutral"}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </td>
                <td>{a.totalScore != null ? `${a.totalScore}/${a.paper.totalMarks}` : "—"}</td>
                <td>{a.fullscreenExitCount}</td>
                <td>
                  {a.flagged ? <span className="status-badge status-bad">Flagged</span> : <span style={{ color: "#8a8372" }}>No</span>}
                </td>
                <td>{a.startedAt.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        basePath="/admin/attempts"
        query={{ q: query || undefined, flagged: onlyFlagged ? "1" : undefined }}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

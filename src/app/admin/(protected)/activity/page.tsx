import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePagePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { Pagination } from "../Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ACTOR_FILTERS = [
  { key: "", label: "All actors" },
  { key: "student", label: "Students" },
  { key: "admin", label: "Admins" },
  { key: "system", label: "System" },
];

function actorClass(t: string): string {
  return t === "admin" ? "status-badge status-pending" : t === "system" ? "status-badge status-neutral" : "status-badge status-good";
}

export default async function ActivityMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; action?: string; page?: string }>;
}) {
  await requirePagePermission(PERMISSIONS.AUDIT_READ);
  const sp = await searchParams;
  const type = sp.type ?? "";
  const action = sp.action ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.AuditLogWhereInput = {};
  if (type) where.actorType = type;
  if (action) where.action = action;

  const [rows, total, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["action"], _count: { _all: true }, orderBy: { _count: { action: "desc" } } }),
  ]);

  const qs = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = { type, action, ...patch };
    if (merged.type) params.set("type", merged.type);
    if (merged.action) params.set("action", merged.action);
    const q = params.toString();
    return q ? `/admin/activity?${q}` : "/admin/activity";
  };

  return (
    <div className="auth-card auth-card-wide">
      <h1>Activity monitor</h1>
      <p className="muted">Append-only audit trail of sensitive actions — logins, purchases, erasures, KYC and payouts. {total} event(s).</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
        {ACTOR_FILTERS.map((f) => (
          <Link key={f.key} href={qs({ type: f.key })} className={`filter-pill${type === f.key ? " active" : ""}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <Link href={qs({ action: "" })} className={`filter-pill${action === "" ? " active" : ""}`}>All actions</Link>
        {actions.map((a) => (
          <Link key={a.action} href={qs({ action: a.action })} className={`filter-pill${action === a.action ? " active" : ""}`}>
            {a.action} ({a._count._all})
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="muted">No events match this filter.</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr><th>Time</th><th>Actor</th><th>Action</th><th>Resource</th><th>IP</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.createdAt.toLocaleString("en-IN")}</td>
                <td>
                  <span className={actorClass(r.actorType)}>{r.actorType}</span>
                  {r.actorLabel && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{r.actorLabel}</div>}
                </td>
                <td style={{ fontWeight: 600 }}>{r.action}</td>
                <td>{r.resourceType ? `${r.resourceType}${r.resourceId ? ` · ${r.resourceId.slice(0, 8)}` : ""}` : "—"}</td>
                <td style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{r.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        basePath="/admin/activity"
        query={{ type: type || undefined, action: action || undefined }}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

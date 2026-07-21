import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/app/AppShell";
import { PLATFORM_TENANT_ID } from "@/lib/tenant";

export const dynamic = "force-dynamic";

interface TeacherCardData {
  id: string;
  slug: string;
  name: string;
  ownerName: string | null;
  tagline: string | null;
}

function TeacherGrid({ teachers, badge }: { teachers: TeacherCardData[]; badge: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "12px",
        marginTop: "12px",
      }}
    >
      {teachers.map((tn) => (
        <Link
          key={tn.id}
          href={`/t/${tn.slug}`}
          style={{
            display: "block",
            padding: "16px",
            border: "1px solid #e5e1d8",
            borderRadius: "12px",
            textDecoration: "none",
            color: "inherit",
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#8a8372" }}>{tn.ownerName ?? "Teacher"}</span>
            <span style={{ fontSize: "11px", color: "#1f7a3d", fontWeight: 600 }}>{badge}</span>
          </div>
          <div style={{ fontWeight: 600, marginTop: "4px", color: "#1a2a44" }}>{tn.name}</div>
          {tn.tagline && <div style={{ marginTop: "6px", fontSize: "13px", color: "#5f5e5a" }}>{tn.tagline}</div>}
        </Link>
      ))}
    </div>
  );
}

export default async function TeachersPage() {
  const { userId, user } = await verifySession();

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { tenant: true },
    orderBy: { createdAt: "desc" },
  });
  const yourTeachers = enrollments
    .map((e) => e.tenant)
    .filter((t) => t.isActive && t.approved && t.id !== PLATFORM_TENANT_ID);
  const yourIds = yourTeachers.map((t) => t.id);

  const explore = await prisma.tenant.findMany({
    where: { isActive: true, approved: true, id: { notIn: [PLATFORM_TENANT_ID, ...yourIds] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="auth-card auth-card-wide">
        <h1>Teachers</h1>
        <p className="page-subtitle">Find your teacher and practice their mock tests.</p>

        {yourTeachers.length > 0 && (
          <>
            <h2 style={{ marginTop: "1rem" }}>Your teachers</h2>
            <TeacherGrid teachers={yourTeachers} badge="Enrolled" />
          </>
        )}

        <h2 style={{ marginTop: yourTeachers.length ? "2rem" : "1rem" }}>Explore teachers</h2>
        {explore.length === 0 ? (
          <p className="muted">No other teachers yet — check back soon.</p>
        ) : (
          <TeacherGrid teachers={explore} badge="View →" />
        )}
      </div>
    </AppShell>
  );
}

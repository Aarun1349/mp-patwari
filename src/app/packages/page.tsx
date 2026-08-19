import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/app/AppShell";
import { prisma } from "@/lib/prisma";
import { getDefaultExamId } from "@/lib/exam/defaultExam";
import { PLATFORM_TENANT_ID } from "@/lib/tenant";
import { BuyButton } from "./BuyButton";

export default async function PackagesPage() {
  const { userId, user } = await verifySession();

  // Flagship exam for the "Originals" section + the per-exam credit balance.
  const examId = await getDefaultExamId();

  const [credit, packages] = await Promise.all([
    prisma.userCredit.findUnique({
      where: { userId_examId_tenantId: { userId, examId, tenantId: PLATFORM_TENANT_ID } },
    }),
    prisma.package.findMany({
      where: { isActive: true },
      include: {
        exam: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ sortOrder: "asc" }],
    }),
  ]);

  const isRepeatBuyer = (credit?.testsTotalPurchased ?? 0) > 0;
  const visible = packages.filter(
    (p) => p.kind === "standard" || (p.kind === "topup" && isRepeatBuyer)
  );

  // Three buckets: our own flagship-exam packages (pushed to the top), our
  // packages for other exams (explore by exam), and independent-teacher
  // packages (explore by teacher). The last two hide when empty.
  const flagship = visible.filter(
    (p) => p.tenantId === PLATFORM_TENANT_ID && p.examId === examId
  );
  const otherExam = visible.filter(
    (p) => p.tenantId === PLATFORM_TENANT_ID && p.examId !== examId
  );
  const teacher = visible.filter((p) => p.tenantId !== PLATFORM_TENANT_ID);

  const examGroups = [...new Map(otherExam.map((p) => [p.examId, p.exam])).values()].map(
    (exam) => ({ exam, pkgs: otherExam.filter((p) => p.examId === exam.id) })
  );
  const tenantGroups = [...new Map(teacher.map((p) => [p.tenantId, p.tenant])).values()].map(
    (tenant) => ({ tenant, pkgs: teacher.filter((p) => p.tenantId === tenant.id) })
  );

  const card = (pkg: (typeof visible)[number]) => {
    const isPopular = pkg.name.toLowerCase() === "popular";
    const perTest = pkg.testCount > 0 ? pkg.pricePaise / 100 / pkg.testCount : 0;
    return (
      <div key={pkg.id} className={`package-card${isPopular ? " popular" : ""}`}>
        {isPopular && <span className="tag">Most Popular</span>}
        <div className="name">
          {pkg.name}
          {pkg.kind === "topup" && " (Top-up)"}
        </div>
        <div className="amount">₹{(pkg.pricePaise / 100).toFixed(0)}</div>
        <div className="per">
          {pkg.testCount} test{pkg.testCount === 1 ? "" : "s"} · ₹{perTest.toFixed(0)}/test
        </div>
        <ul>
          <li>{pkg.testCount} full-length mock tests</li>
          <li>Section-wise analysis after each test</li>
          <li>{pkg.validityDays} days validity</li>
          {pkg.kind === "topup" && <li>Existing-customer pricing</li>}
        </ul>
        <BuyButton packageId={pkg.id} />
      </div>
    );
  };

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      {/* Section 1 — our own packages, pushed to the top */}
      <div className="auth-card auth-card-wide">
        <div className="section-head">
          <div>
            <h1>Test Packages</h1>
            <p className="page-subtitle">
              One-time purchase. Tests are added to your account immediately.
            </p>
          </div>
          <span className="official-badge">ExamsExpress Official</span>
        </div>
        <p className="muted" style={{ marginTop: "-4px", marginBottom: "20px" }}>
          {credit?.testsRemaining ?? 0} paid test(s) remaining on your account.
        </p>

        {flagship.length > 0 ? (
          <div className="package-grid">{flagship.map(card)}</div>
        ) : (
          <p className="muted">No packages available for this exam yet.</p>
        )}
      </div>

      {/* Section 2 — explore our packages for other exams */}
      {examGroups.length > 0 && (
        <div className="auth-card auth-card-wide">
          <h2 className="explore-title">Explore more exams</h2>
          {examGroups.map((g) => (
            <div key={g.exam.id} className="explore-group">
              <h3 className="explore-group-title">{g.exam.name}</h3>
              <div className="package-grid">{g.pkgs.map(card)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Section 3 — explore independent-teacher packages */}
      {tenantGroups.length > 0 && (
        <div className="auth-card auth-card-wide">
          <h2 className="explore-title">From independent teachers</h2>
          {tenantGroups.map((g) => (
            <div key={g.tenant.id} className="explore-group">
              <div className="explore-group-head">
                <h3 className="explore-group-title">{g.tenant.name}</h3>
                <Link href={`/t/${g.tenant.slug}`} className="explore-store-link">
                  Visit storefront →
                </Link>
              </div>
              <div className="package-grid">{g.pkgs.map(card)}</div>
            </div>
          ))}
        </div>
      )}

      <p className="muted" style={{ textAlign: "center", margin: "8px 0 4px" }}>
        See our <Link href="/disclaimer">Disclaimer &amp; Policies</Link> — all purchases are
        final, no refunds.
      </p>
    </AppShell>
  );
}

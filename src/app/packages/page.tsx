import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/app/AppShell";
import { prisma } from "@/lib/prisma";
import { BuyButton } from "./BuyButton";

export default async function PackagesPage() {
  const { userId, user } = await verifySession();

  const [credit, packages] = await Promise.all([
    prisma.userCredit.findUnique({ where: { userId } }),
    prisma.package.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const isRepeatBuyer = (credit?.testsTotalPurchased ?? 0) > 0;
  const visiblePackages = packages.filter(
    (p) => p.kind === "standard" || (p.kind === "topup" && isRepeatBuyer)
  );

  return (
    <AppShell userLabel={user.phone ?? user.email ?? ""}>
      <div className="auth-card auth-card-wide">
        <h1>Test Packages</h1>
        <p className="muted">One-time purchase. Tests are added to your account immediately.</p>
        <p className="muted">
          {credit?.testsRemaining ?? 0} paid test(s) remaining on your account.
        </p>

        <div className="package-grid">
          {visiblePackages.map((pkg) => {
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
          })}
        </div>

        <p className="muted" style={{ marginTop: "20px" }}>
          See our <Link href="/disclaimer">Disclaimer &amp; Policies</Link> — all purchases are
          final, no refunds.
        </p>
      </div>
    </AppShell>
  );
}

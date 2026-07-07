import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { BuyButton } from "./BuyButton";

export default async function PackagesPage() {
  const { userId } = await verifySession();

  const [credit, packages] = await Promise.all([
    prisma.userCredit.findUnique({ where: { userId } }),
    prisma.package.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const isRepeatBuyer = (credit?.testsTotalPurchased ?? 0) > 0;
  const visiblePackages = packages.filter(
    (p) => p.kind === "standard" || (p.kind === "topup" && isRepeatBuyer)
  );

  return (
    <main className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Test Packages</h1>
        <p className="muted">One-time purchase. Tests are added to your account immediately.</p>

        <table className="report-table">
          <thead>
            <tr>
              <th>Package</th>
              <th>Tests</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visiblePackages.map((pkg) => (
              <tr key={pkg.id}>
                <td>
                  {pkg.name}
                  {pkg.kind === "topup" && " (top-up)"}
                </td>
                <td>{pkg.testCount}</td>
                <td>₹{(pkg.pricePaise / 100).toFixed(2)}</td>
                <td>
                  <BuyButton packageId={pkg.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="muted" style={{ marginTop: "16px" }}>
          See our <Link href="/disclaimer">Disclaimer &amp; Policies</Link> — all purchases are
          final, no refunds.
        </p>
      </div>
    </main>
  );
}

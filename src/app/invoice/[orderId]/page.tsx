import { notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getTaxConfig } from "@/lib/billing/tax";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #e5e1d8", fontSize: "14px" };
const th: React.CSSProperties = { ...cell, textAlign: "left", color: "#5f5e5a", fontWeight: 600 };

export default async function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const { userId, user } = await verifySession();

  // Ownership: the order must be the caller's and paid (an invoice implies payment).
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: "paid" },
    include: {
      package: { select: { name: true, testCount: true } },
      tenant: { select: { name: true } },
    },
  });
  if (!order) notFound();

  const cfg = getTaxConfig();
  const taxable = order.taxableValuePaise ?? order.amountPaise;
  const tax = order.taxPaise;
  const gstPct = order.gstRateBps > 0 ? (order.gstRateBps / 100).toFixed(0) : null;

  return (
    <main style={{ background: "#f6f4ee", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`@media print { .no-print { display: none !important; } main { background: #fff !important; padding: 0 !important; } }`}</style>

      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
          <Link href="/purchases">← Back to purchases</Link>
          <PrintButton />
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e1d8", borderRadius: "12px", padding: "28px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1a2a44", paddingBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#1a2a44" }}>ExamsExpress</div>
              <div style={{ fontSize: "12px", color: "#8a8372" }}>
                Tax Invoice{cfg.platformGstin ? ` · GSTIN ${cfg.platformGstin}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "13px" }}>
              <div style={{ fontWeight: 600 }}>{order.invoiceNo ?? order.id}</div>
              <div style={{ color: "#8a8372" }}>{(order.invoiceDate ?? order.paidAt)?.toLocaleDateString("en-IN")}</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", margin: "18px 0", fontSize: "13px" }}>
            <div>
              <div style={{ color: "#8a8372", marginBottom: "4px" }}>Billed to</div>
              <div style={{ fontWeight: 600 }}>{user.name ?? user.phone ?? user.email ?? "Student"}</div>
              {user.phone && <div style={{ color: "#5f5e5a" }}>{user.phone}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#8a8372", marginBottom: "4px" }}>Sold by</div>
              <div style={{ fontWeight: 600 }}>{order.tenant?.name ?? "ExamsExpress"}</div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
            <thead>
              <tr>
                <th style={th}>Description</th>
                {order.sacCode && <th style={{ ...th, textAlign: "center" }}>SAC</th>}
                <th style={{ ...th, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cell}>
                  {order.package.name}
                  <span style={{ color: "#8a8372" }}> ({order.package.testCount} tests)</span>
                </td>
                {order.sacCode && <td style={{ ...cell, textAlign: "center" }}>{order.sacCode}</td>}
                <td style={{ ...cell, textAlign: "right" }}>{rupees(taxable)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...cell, borderBottom: "none" }} colSpan={order.sacCode ? 2 : 1}>Taxable value</td>
                <td style={{ ...cell, borderBottom: "none", textAlign: "right" }}>{rupees(taxable)}</td>
              </tr>
              <tr>
                <td style={{ ...cell, borderBottom: "none" }} colSpan={order.sacCode ? 2 : 1}>
                  GST{gstPct ? ` @ ${gstPct}%` : ""}
                </td>
                <td style={{ ...cell, borderBottom: "none", textAlign: "right" }}>{rupees(tax)}</td>
              </tr>
              {order.discountPaise > 0 && (
                <tr>
                  <td style={{ ...cell, borderBottom: "none" }} colSpan={order.sacCode ? 2 : 1}>Discount</td>
                  <td style={{ ...cell, borderBottom: "none", textAlign: "right" }}>− {rupees(order.discountPaise)}</td>
                </tr>
              )}
              <tr>
                <td style={{ ...cell, fontWeight: 700, borderTop: "2px solid #1a2a44" }} colSpan={order.sacCode ? 2 : 1}>
                  Total paid
                </td>
                <td style={{ ...cell, fontWeight: 700, borderTop: "2px solid #1a2a44", textAlign: "right" }}>
                  {rupees(order.amountPaise)}
                </td>
              </tr>
            </tfoot>
          </table>

          <p style={{ fontSize: "11px", color: "#8a8372", marginTop: "18px" }}>
            {gstPct
              ? "This is a computer-generated tax invoice."
              : "This is a computer-generated receipt. GST is not applied to this order."}
          </p>
        </div>
      </div>
    </main>
  );
}

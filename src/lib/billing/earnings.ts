import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * A teacher's (tenant's) earnings, Udemy-style: gross ex-GST sales attributed to
 * the tenant → platform commission → the tenant's net share (revenueShareBps).
 * Earnings accrue on the ex-GST taxable value; TDS (if any) is applied when a
 * PayoutStatement is generated, not here.
 */
export interface TenantEarnings {
  grossPaise: number;
  commissionPaise: number;
  netPaise: number;
  paidOrders: number;
  revenueShareBps: number;
}

export async function computeTenantEarnings(tenantId: string): Promise<TenantEarnings> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { revenueShareBps: true },
  });
  const shareBps = tenant?.revenueShareBps ?? 0;

  const agg = await prisma.order.aggregate({
    where: { tenantId, status: "paid" },
    _sum: { taxableValuePaise: true, amountPaise: true },
    _count: { _all: true },
  });

  // Ex-GST taxable value; fall back to amount for pre-billing orders (taxableValue null).
  const gross = agg._sum.taxableValuePaise ?? agg._sum.amountPaise ?? 0;
  const net = Math.round((gross * shareBps) / 10000);

  return {
    grossPaise: gross,
    commissionPaise: gross - net,
    netPaise: net,
    paidOrders: agg._count._all,
    revenueShareBps: shareBps,
  };
}

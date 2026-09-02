import "server-only";
import { prisma } from "@/lib/prisma";
import { computeTenantEarnings } from "./earnings";
import { computeTds, LEGAL } from "@/lib/legal";

/**
 * Teacher payout backbone (Workstream D). Money to a teacher is gated: it never
 * leaves until KYC is verified AND the current teacher agreement version is
 * accepted. TDS is withheld from the teacher's net share (higher rate without a
 * PAN on file). Payout records go through the existing PayoutStatement model.
 */

export interface PayoutReadiness {
  kycVerified: boolean;
  agreementCurrent: boolean;
  canPay: boolean;
  missing: string[];
}

/** Eligibility to be PAID. Both KYC and the current agreement are required. */
export function payoutReadiness(tenant: {
  kycVerified: boolean;
  panNumber: string | null;
  bankAccountNumber: string | null;
  upiId: string | null;
  agreementVersion: string | null;
}): PayoutReadiness {
  const missing: string[] = [];
  if (!tenant.kycVerified) missing.push("KYC not verified");
  if (!tenant.panNumber) missing.push("PAN not on file");
  if (!tenant.bankAccountNumber && !tenant.upiId) missing.push("Bank account or UPI not on file");
  const agreementCurrent = tenant.agreementVersion === LEGAL.payout.agreementVersion;
  if (!agreementCurrent) missing.push(`Current teacher agreement (v${LEGAL.payout.agreementVersion}) not accepted`);
  return {
    kycVerified: tenant.kycVerified,
    agreementCurrent,
    canPay: missing.length === 0,
    missing,
  };
}

export interface PayoutPreview {
  grossPaise: number;
  commissionPaise: number;
  netPaise: number; // teacher's share before TDS
  tdsPaise: number; // withheld from net
  payablePaise: number; // net − TDS = what the teacher actually receives
  tdsRatePercent: number;
  tdsSection: string;
  revenueShareBps: number;
}

/** What a teacher is owed right now: their net share, less TDS. Pure read. */
export async function previewPayout(tenantId: string): Promise<PayoutReadiness & PayoutPreview> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      kycVerified: true, panNumber: true, bankAccountNumber: true, upiId: true, agreementVersion: true,
    },
  });
  const earnings = await computeTenantEarnings(tenantId);
  const { tdsPaise, ratePercent, section } = computeTds(earnings.netPaise, !!tenant.panNumber);
  return {
    ...payoutReadiness(tenant),
    grossPaise: earnings.grossPaise,
    commissionPaise: earnings.commissionPaise,
    netPaise: earnings.netPaise,
    tdsPaise,
    payablePaise: Math.max(0, earnings.netPaise - tdsPaise),
    tdsRatePercent: ratePercent,
    tdsSection: section,
    revenueShareBps: earnings.revenueShareBps,
  };
}

/**
 * Record a payout for the amount owed SINCE the last payout, TDS withheld. GATED —
 * throws if the tenant isn't payout-ready (KYC + current agreement), so money can
 * never be recorded as paid to an un-onboarded teacher. Incremental: earnings are
 * lifetime aggregates, so we subtract what's already been paid and only settle the
 * delta (idempotent-ish — a second call with no new sales records nothing).
 */
export async function recordPayout(
  tenantId: string
): Promise<{ statementId: string; netPaise: number } | { nothingToPay: true }> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      createdAt: true,
      kycVerified: true, panNumber: true, bankAccountNumber: true, upiId: true, agreementVersion: true,
    },
  });
  const readiness = payoutReadiness(tenant);
  if (!readiness.canPay) {
    throw new Error(`Cannot pay out: ${readiness.missing.join("; ")}`);
  }

  const earnings = await computeTenantEarnings(tenantId);
  const [prior, lastPaid] = await Promise.all([
    prisma.payoutStatement.aggregate({
      where: { tenantId, status: "paid" },
      _sum: { grossPaise: true, commissionPaise: true, netPaise: true },
    }),
    prisma.payoutStatement.findFirst({
      where: { tenantId, status: "paid" },
      orderBy: { periodEnd: "desc" },
      select: { periodEnd: true },
    }),
  ]);

  const thisNet = earnings.netPaise - (prior._sum.netPaise ?? 0);
  if (thisNet <= 0) return { nothingToPay: true };
  const { tdsPaise } = computeTds(thisNet, !!tenant.panNumber);

  const statement = await prisma.payoutStatement.create({
    data: {
      tenantId,
      periodStart: lastPaid?.periodEnd ?? tenant.createdAt,
      periodEnd: new Date(),
      grossPaise: earnings.grossPaise - (prior._sum.grossPaise ?? 0),
      commissionPaise: earnings.commissionPaise - (prior._sum.commissionPaise ?? 0),
      netPaise: thisNet,
      tdsPaise,
      status: "paid",
    },
    select: { id: true },
  });
  return { statementId: statement.id, netPaise: thisNet };
}

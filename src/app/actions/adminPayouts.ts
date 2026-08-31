"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { PLATFORM_TENANT_ID } from "@/lib/tenant";
import { LEGAL } from "@/lib/legal";
import { recordPayout } from "@/lib/billing/payout";

export type PayoutActionState = { error?: string; ok?: string } | undefined;

function s(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length ? v : null;
}

/** Capture / edit a teacher's KYC + payout details. Editing resets verification. */
export async function saveTenantKycAction(
  _prev: PayoutActionState,
  formData: FormData
): Promise<PayoutActionState> {
  const gate = await checkPermission(PERMISSIONS.TENANT_ONBOARD);
  if ("error" in gate) return { error: "Not allowed." };

  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId || tenantId === PLATFORM_TENANT_ID) return { error: "Invalid teacher." };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      payeeLegalName: s(formData, "payeeLegalName"),
      panNumber: s(formData, "panNumber")?.toUpperCase() ?? null,
      payoutGstin: s(formData, "payoutGstin")?.toUpperCase() ?? null,
      bankAccountName: s(formData, "bankAccountName"),
      bankAccountNumber: s(formData, "bankAccountNumber"),
      bankIfsc: s(formData, "bankIfsc")?.toUpperCase() ?? null,
      upiId: s(formData, "upiId"),
      // Any edit to the details invalidates a prior verification — re-verify.
      kycVerified: false,
      kycVerifiedAt: null,
    },
  });
  revalidatePath(`/admin/tenants/${tenantId}/payout`);
  return { ok: "KYC details saved. Re-verify to enable payouts." };
}

/** Mark a teacher's KYC verified (or un-verify). Super-admin / onboarder only. */
export async function setKycVerifiedAction(formData: FormData): Promise<void> {
  const gate = await checkPermission(PERMISSIONS.TENANT_ONBOARD);
  if ("error" in gate) return;
  const tenantId = String(formData.get("tenantId") ?? "");
  const verify = String(formData.get("verify") ?? "") === "1";
  if (!tenantId || tenantId === PLATFORM_TENANT_ID) return;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { kycVerified: verify, kycVerifiedAt: verify ? new Date() : null },
  });
  revalidatePath(`/admin/tenants/${tenantId}/payout`);
}

/** Record that the teacher accepted the current agreement version. */
export async function acceptAgreementAction(formData: FormData): Promise<void> {
  const gate = await checkPermission(PERMISSIONS.TENANT_ONBOARD);
  if ("error" in gate) return;
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId || tenantId === PLATFORM_TENANT_ID) return;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { agreementVersion: LEGAL.payout.agreementVersion, agreementAcceptedAt: new Date() },
  });
  revalidatePath(`/admin/tenants/${tenantId}/payout`);
}

/** Record a payout for what's owed since the last one — GATED in recordPayout(). */
export async function recordPayoutAction(
  _prev: PayoutActionState,
  formData: FormData
): Promise<PayoutActionState> {
  const gate = await checkPermission(PERMISSIONS.TENANT_ONBOARD);
  if ("error" in gate) return { error: "Not allowed." };
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId || tenantId === PLATFORM_TENANT_ID) return { error: "Invalid teacher." };

  try {
    const res = await recordPayout(tenantId);
    revalidatePath(`/admin/tenants/${tenantId}/payout`);
    if ("nothingToPay" in res) return { ok: "Nothing new to pay out." };
    return { ok: `Payout recorded: ₹${(res.netPaise / 100).toFixed(2)} net (TDS withheld).` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not record payout." };
  }
}

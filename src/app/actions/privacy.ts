"use server";

import { redirect } from "next/navigation";
import { verifySession, destroySession } from "@/lib/auth/session";
import { eraseUserData } from "@/lib/privacy";
import { writeAudit } from "@/lib/audit";

export type EraseState = { error?: string } | undefined;

// DPDP right to erasure. Requires the student to type DELETE to confirm, then
// anonymises the account (retaining financial/tax records), kills sessions, clears
// the cookie and sends them home.
export async function eraseAccountAction(
  _prevState: EraseState,
  formData: FormData
): Promise<EraseState> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    return { error: 'Type DELETE (in capitals) to confirm.' };
  }

  const { userId } = await verifySession();
  try {
    await eraseUserData(userId);
  } catch (err) {
    console.error("eraseAccountAction failed", err);
    return { error: "Something went wrong. Please try again or contact support." };
  }

  await writeAudit({
    actorType: "student",
    actorId: userId,
    action: "account_erased",
    resourceType: "User",
    resourceId: userId,
  });

  await destroySession();
  redirect("/?erased=1");
}

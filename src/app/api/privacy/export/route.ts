import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { collectUserData } from "@/lib/privacy";

// DPDP right to access: the logged-in student downloads a machine-readable JSON
// of everything we hold on them. Auth-gated + scoped to the caller's own userId.
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await verifySession();
  const data = await collectUserData(userId);

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="examsexpress-data-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

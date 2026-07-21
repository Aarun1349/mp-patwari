"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/adminSession";
import { prisma } from "@/lib/prisma";
import { getDefaultExamId } from "@/lib/exam/defaultExam";
import { PLATFORM_TENANT_ID } from "@/lib/tenant";

export type GrantCreditsState = { success?: boolean; error?: string } | undefined;

const GrantSchema = z.object({
  userId: z.string().min(1),
  testCount: z.coerce.number().int().positive().max(100),
});

/** Admin-granted credits are tracked separately from testsTotalPurchased —
 * that field gates top-up package visibility to actual paying customers, and
 * a free grant shouldn't count as a purchase. */
export async function grantCreditsAction(
  _prevState: GrantCreditsState,
  formData: FormData
): Promise<GrantCreditsState> {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not authorized. Please sign in again." };

  const parsed = GrantSchema.safeParse({
    userId: formData.get("userId"),
    testCount: formData.get("testCount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return { error: "User not found." };

  const examId = await getDefaultExamId();
  await prisma.userCredit.upsert({
    where: {
      userId_examId_tenantId: { userId: parsed.data.userId, examId, tenantId: PLATFORM_TENANT_ID },
    },
    create: {
      userId: parsed.data.userId,
      examId,
      tenantId: PLATFORM_TENANT_ID,
      testsRemaining: parsed.data.testCount,
    },
    update: { testsRemaining: { increment: parsed.data.testCount } },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * DPDP Act 2023 — data-principal rights.
 *
 * `collectUserData` implements the Right to Access / data portability: a complete,
 * structured dump of everything ExamsExpress holds about one student.
 * `eraseUserData` implements the Right to Erasure — but as **anonymise + soft
 * delete**, never a hard delete (Golden Rule #1): orders, invoices, test-credit
 * entitlements and attempts are financial / tax / integrity records we retain.
 * Erasure strips the PII that links those records to a real person and frees the
 * login identity, and deletes the account's live sessions so it's locked out
 * immediately.
 *
 * Every query here is scoped by `userId` (Golden Rule #2).
 */

/** Right to Access — gather all personal data for one student as a portable object. */
export async function collectUserData(userId: string) {
  const [user, orders, credits, attempts, enrollments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, phone: true, email: true, name: true, emailVerified: true,
        dateOfBirth: true, city: true, category: true, qualification: true,
        examInterest: true, contactPhone: true,
        signupSource: true, signupMedium: true, signupCampaign: true,
        createdAt: true, lastLoginAt: true,
      },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, amountPaise: true, discountPaise: true,
        taxableValuePaise: true, taxPaise: true, invoiceNo: true, invoiceDate: true,
        paidAt: true, createdAt: true,
        package: { select: { name: true, testCount: true } },
        coupon: { select: { code: true } },
      },
    }),
    prisma.userCredit.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        testsRemaining: true, testsTotalPurchased: true, updatedAt: true,
        exam: { select: { name: true } },
        tenant: { select: { name: true } },
      },
    }),
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      select: {
        id: true, status: true, totalScore: true, startedAt: true, submittedAt: true,
        paper: { select: { title: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, tenant: { select: { name: true } } },
    }),
  ]);

  return {
    _meta: {
      export: "ExamsExpress personal data export",
      generatedAt: new Date().toISOString(),
      note: "This is the personal data ExamsExpress holds about you (DPDP Act 2023, right to access). Financial and tax records are retained where the law requires, even after account erasure.",
    },
    account: user,
    orders,
    testCredits: credits,
    examAttempts: attempts,
    enrollments,
  };
}

/**
 * Right to Erasure — anonymise PII, free the login identity and deactivate the
 * account (soft delete). Retains orders / invoices / test credits / attempts
 * (legal + integrity records, still linked to the now-anonymous user row). Deletes
 * live sessions + transient OTP challenges so the account is locked out at once.
 * The caller must clear the current session cookie and redirect.
 */
export async function eraseUserData(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        // Free the login identities (phone/googleId are unique) so a future fresh
        // signup can reuse the number, and strip every profile PII field.
        phone: null,
        googleId: null,
        email: null,
        emailVerified: false,
        name: "Deleted user",
        dateOfBirth: null,
        city: null,
        category: null,
        qualification: null,
        examInterest: null,
        contactPhone: null,
        signupSource: null,
        signupMedium: null,
        signupCampaign: null,
      },
    }),
    // Lock out immediately + drop transient auth data.
    prisma.session.deleteMany({ where: { userId } }),
    prisma.otpChallenge.deleteMany({ where: { userId } }),
  ]);

  console.log(`[privacy] account erased (anonymised): ${userId}`);
}

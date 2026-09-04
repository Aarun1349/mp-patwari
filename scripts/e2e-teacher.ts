/**
 * End-to-end test for the TEACHER (tenant) onboarding + selling flow, exercised
 * against the local DB with the REAL money code (creditFreeOrder → applyPackageCredit,
 * computeTenantEarnings, startAttempt). Confirms Phase B (stage-scoped credits) did
 * not break the marketplace: a student's purchase of a teacher package credits the
 * teacher's own (exam, PRELIMS, tenant) pool, auto-enrols them, assigns an invoice,
 * accrues the teacher's revenue share, and lets them start the teacher's paper. All
 * fixtures are cleaned up.
 *
 *   NODE_OPTIONS="--conditions=react-server" npx tsx --env-file=.env scripts/e2e-teacher.ts
 */
import { PrismaClient } from "@prisma/client";
import { creditFreeOrder } from "../src/lib/payments/creditOrder";
import { computeTenantEarnings } from "../src/lib/billing/earnings";
import { startAttempt } from "../src/lib/exam/entitlement";

const prisma = new PrismaClient();
const TAG = "[E2E-TEACHER]";
let ok = true;
function check(label: string, actual: unknown, expected: unknown) {
  const pass = actual === expected;
  if (!pass) ok = false;
  console.log(`  ${pass ? "✅" : "❌"} ${label}: got ${actual}, expected ${expected}`);
}

async function main() {
  const exam = await prisma.exam.findUniqueOrThrow({ where: { slug: "mp-si" } });
  const section = await prisma.section.findFirstOrThrow({ where: { examId: exam.id }, orderBy: { sortOrder: "asc" } });
  const partnerRole = await prisma.role.findUnique({ where: { key: "partner" } });

  // 1) Onboard a teacher: tenant (70% share) + partner login (as createTenantAction does).
  const tenant = await prisma.tenant.create({
    data: { slug: `${TAG.toLowerCase().replace(/[^a-z0-9]/g, "")}-t`, name: `${TAG} Ravi Sir`, ownerName: "Ravi Sir", revenueShareBps: 7000, approved: true, isActive: true, onboardedBy: "e2e" },
  });
  const partnerCreated = !!partnerRole;
  if (partnerRole) {
    await prisma.adminUser.create({
      data: { email: `${TAG.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`, passwordHash: "x".repeat(60), name: "Ravi Sir", roleId: partnerRole.id, tenantId: tenant.id },
    });
  }
  console.log("▶ ONBOARDING");
  check("partner role exists (login creatable)", partnerCreated, true);
  check("tenant revenue share ≤ 70% (bps)", tenant.revenueShareBps, 7000);

  // 2) Teacher creates a package scoped to their tenant (Prelims credits; mainsCount defaults 0).
  const pkg = await prisma.package.create({
    data: { name: `${TAG} 5 Mocks`, testCount: 5, pricePaise: 49900, examId: exam.id, tenantId: tenant.id, kind: "standard", validityDays: 90, sortOrder: 1 },
  });

  // 3) A student buys it — real credit path (creditFreeOrder credits + enrols + invoices).
  const student = await prisma.user.create({ data: { phone: "9990000009", name: `${TAG} student` } });
  const order = await prisma.order.create({
    data: { userId: student.id, packageId: pkg.id, tenantId: tenant.id, amountPaise: 49900, taxableValuePaise: 49900, status: "created" },
  });
  const credited = await creditFreeOrder(order.id);

  console.log("\n▶ PURCHASE → CREDIT + ENROLMENT");
  check("order credited", credited.credited, true);
  const credit = await prisma.userCredit.findFirstOrThrow({ where: { userId: student.id, examId: exam.id, stage: "PRELIMS", tenantId: tenant.id } });
  check("credit in teacher's PRELIMS pool", credit.testsRemaining, 5);
  const enrol = await prisma.enrollment.findUnique({ where: { userId_tenantId: { userId: student.id, tenantId: tenant.id } } });
  check("student auto-enrolled with teacher", !!enrol, true);
  const paidOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  check("order status paid", paidOrder.status, "paid");
  check("invoice number assigned", !!paidOrder.invoiceNo, true);

  // 4) Teacher's revenue share accrues (70% of ex-GST gross).
  const earnings = await computeTenantEarnings(tenant.id);
  console.log("\n▶ EARNINGS (70% share)");
  check("gross", earnings.grossPaise, 49900);
  check("teacher net (70%)", earnings.netPaise, 34930);
  check("platform commission (30%)", earnings.commissionPaise, 14970);

  // 5) Student starts the TEACHER's paper — decrements the teacher pool (not platform).
  const paper = await prisma.paper.create({
    data: { title: `${TAG} Mock`, sequenceNo: 1, examId: exam.id, tenantId: tenant.id, isFree: false, isActive: true, totalQuestions: 5, totalMarks: 5, durationMinutes: 30, sourceLang: "hi" },
  });
  for (let i = 0; i < 3; i++) {
    await prisma.question.create({
      data: { paperId: paper.id, sectionId: section.id, text: `${TAG} Q${i}`, marks: 1, negativeMarks: 0, options: { create: [0, 1, 2, 3].map((j) => ({ label: ["A", "B", "C", "D"][j], text: `${TAG} o${j}`, isCorrect: j === 0, sortOrder: j })) } },
    });
  }
  const { attemptId } = await startAttempt(student.id, paper.id);
  const after = await prisma.userCredit.findFirstOrThrow({ where: { userId: student.id, examId: exam.id, stage: "PRELIMS", tenantId: tenant.id } });
  console.log("\n▶ ATTEMPT (teacher paper draws teacher pool)");
  check("teacher pool decremented 5 → 4", after.testsRemaining, 4);

  // Cleanup
  console.log("\n🧹 Cleaning up…");
  await prisma.answer.deleteMany({ where: { attemptId } });
  await prisma.attempt.deleteMany({ where: { userId: student.id } });
  await prisma.questionOption.deleteMany({ where: { question: { text: { startsWith: TAG } } } });
  await prisma.question.deleteMany({ where: { text: { startsWith: TAG } } });
  await prisma.paper.deleteMany({ where: { title: { startsWith: TAG } } });
  await prisma.userCredit.deleteMany({ where: { userId: student.id } });
  await prisma.enrollment.deleteMany({ where: { userId: student.id } });
  await prisma.order.deleteMany({ where: { userId: student.id } });
  await prisma.user.delete({ where: { id: student.id } });
  await prisma.package.deleteMany({ where: { name: { startsWith: TAG } } });
  await prisma.adminUser.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.tenant.delete({ where: { id: tenant.id } });
  console.log("Cleanup done.");

  console.log(`\n${ok ? "✅ TEACHER E2E PASSED" : "❌ TEACHER E2E FAILED"}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

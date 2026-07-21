// Proves tenant isolation of credits at the exact query entitlement.ts uses.
// Creates a throwaway student, grants a tenant-scoped credit, and asserts the
// credit can ONLY be consumed for that tenant's papers — not another tenant's
// or the platform's. Cleans up after itself.
// Usage: npx tsx --env-file=.env scripts/verify-tenant-isolation.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let failures = 0;
function assert(cond: boolean, msg: string) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
}

/** Mirrors entitlement.ts startAttempt's atomic credit decrement (the money path). */
async function tryConsume(userId: string, examId: string, tenantId: string): Promise<boolean> {
  const res = await prisma.userCredit.updateMany({
    where: { userId, examId, tenantId, testsRemaining: { gt: 0 } },
    data: { testsRemaining: { decrement: 1 } },
  });
  return res.count > 0;
}

async function main() {
  const exam = await prisma.exam.findUnique({ where: { slug: "mp-tet-varg-2" } });
  const ravi = await prisma.tenant.findUnique({ where: { slug: "ravi-sir" } });
  if (!exam || !ravi) throw new Error("Run scripts/seed-tenant-demo.ts first.");
  const PLATFORM = "platform";

  const student = await prisma.user.create({
    data: { phone: `99990${Math.floor(10000 + Math.random() * 89999)}`, name: "Isolation Test Student" },
  });

  try {
    // Student buys Ravi Sir's package -> credit scoped to (student, exam, ravi).
    await prisma.userCredit.create({
      data: { userId: student.id, examId: exam.id, tenantId: ravi.id, testsRemaining: 1, testsTotalPurchased: 1 },
    });

    // 1) Can consume for Ravi's paper.
    assert(await tryConsume(student.id, exam.id, ravi.id), "Ravi-Sir credit opens a Ravi-Sir paper");

    // 2) After consuming the one credit, Ravi balance is empty.
    assert(!(await tryConsume(student.id, exam.id, ravi.id)), "Ravi-Sir credit is depleted after one use");

    // Re-grant one Ravi credit for the negative tests.
    await prisma.userCredit.update({
      where: { userId_examId_tenantId: { userId: student.id, examId: exam.id, tenantId: ravi.id } },
      data: { testsRemaining: 1 },
    });

    // 3) The Ravi credit CANNOT open a platform paper.
    assert(!(await tryConsume(student.id, exam.id, PLATFORM)), "Ravi-Sir credit does NOT open a platform paper");

    // 4) The Ravi credit CANNOT open a different tenant's paper.
    assert(!(await tryConsume(student.id, exam.id, "some-other-tenant")), "Ravi-Sir credit does NOT open another tenant's paper");

    // 5) Ravi credit still intact (the failed attempts didn't touch it).
    const remaining = await prisma.userCredit.findUnique({
      where: { userId_examId_tenantId: { userId: student.id, examId: exam.id, tenantId: ravi.id } },
    });
    assert(remaining?.testsRemaining === 1, "Ravi-Sir balance untouched by cross-tenant attempts");
  } finally {
    await prisma.userCredit.deleteMany({ where: { userId: student.id } });
    await prisma.user.delete({ where: { id: student.id } });
  }

  console.log(failures === 0 ? "\nAll isolation checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

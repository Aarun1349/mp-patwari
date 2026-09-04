/**
 * End-to-end test for the MP SI flow — exercises the REAL engine code paths
 * (startAttempt → save answers → finalizeAttempt → scoreAttempt) against the
 * local DB, for both a Prelims mock (no negative marking) and a Mains paper
 * (negative marking). Seeds throwaway questions on the real seeded papers, runs
 * two attempts, asserts the scores, then cleans up all test data it created.
 *
 * Run (the react-server condition neutralises the `server-only` guard so the real
 * engine modules import in a plain script):
 *   NODE_OPTIONS="--conditions=react-server" npx tsx --env-file=.env scripts/e2e-mp-si.ts
 *
 * Prereq: local DB migrated + seeded (`prisma db push` then `prisma/seed-mp-si.ts`).
 */
import { PrismaClient } from "@prisma/client";
import { startAttempt } from "../src/lib/exam/entitlement";
import { finalizeAttempt } from "../src/lib/exam/finalize";

const prisma = new PrismaClient();

const TAG = "[E2E-TEST]"; // marks throwaway questions for cleanup
const N = 10; // questions per paper
const CORRECT = 6;
const WRONG = 2; // remaining (N - CORRECT - WRONG) are skipped

let ok = true;
function check(label: string, actual: number, expected: number) {
  const pass = Math.abs(actual - expected) < 1e-6;
  if (!pass) ok = false;
  console.log(`  ${pass ? "✅" : "❌"} ${label}: got ${actual}, expected ${expected}`);
}

async function seedQuestions(paperId: string, sectionId: string, marks: number, negativeMarks: number) {
  const ids: string[] = [];
  for (let i = 0; i < N; i++) {
    const q = await prisma.question.create({
      data: {
        paperId,
        sectionId,
        text: `${TAG} Q${i + 1}`,
        marks,
        negativeMarks,
        options: {
          create: [0, 1, 2, 3].map((j) => ({
            label: ["A", "B", "C", "D"][j],
            text: `${TAG} opt ${j}`,
            isCorrect: j === 0, // option A is always correct in the fixture
            sortOrder: j,
          })),
        },
      },
      include: { options: true },
    });
    ids.push(q.id);
  }
  return ids;
}

async function runPaper(label: string, userId: string, paperId: string, sectionId: string) {
  const paper = await prisma.paper.findUniqueOrThrow({ where: { id: paperId } });
  const marks = paper.totalMarks / paper.totalQuestions;
  const negativeMarks = paper.negativeMarkingRatio * marks;
  // Expected is derived from THIS paper's pattern, so the test stays valid for any
  // exam/stage (no negative for Prelims, 1/3 for MP SI Mains, 0.25 for Group-2, …).
  const expectScore = CORRECT * marks - WRONG * negativeMarks;
  console.log(`\n▶ ${label} — ${paper.title}`);
  console.log(`  pattern: ${marks} marks/Q, negative ${negativeMarks}/Q (ratio ${paper.negativeMarkingRatio})`);

  const qids = await seedQuestions(paperId, sectionId, marks, negativeMarks);
  await prisma.paper.update({ where: { id: paperId }, data: { isActive: true } });

  const { attemptId } = await startAttempt(userId, paperId);

  // Answer CORRECT questions right (option A), WRONG questions wrong (option B),
  // and leave the rest skipped (no answer row).
  for (let i = 0; i < CORRECT + WRONG; i++) {
    const opts = await prisma.questionOption.findMany({ where: { questionId: qids[i] }, orderBy: { sortOrder: "asc" } });
    const chosen = i < CORRECT ? opts[0].id : opts[1].id; // A = correct, B = wrong
    await prisma.answer.create({ data: { attemptId, questionId: qids[i], selectedOptionId: chosen } });
  }

  const result = await finalizeAttempt(attemptId, "submitted");
  check(`${label} totalScore`, result.totalScore, expectScore);
  check(`${label} accuracyPct`, Math.round(result.accuracyPct * 100) / 100, 75);

  return { attemptId, qids };
}

async function main() {
  const exam = await prisma.exam.findUniqueOrThrow({ where: { slug: "mp-si" } });
  const section = await prisma.section.findFirstOrThrow({ where: { examId: exam.id }, orderBy: { sortOrder: "asc" } });
  const prelims = await prisma.paper.findFirstOrThrow({ where: { examId: exam.id, title: "MP SI Prelims — Free Mock 1" } });
  const mains = await prisma.paper.findFirstOrThrow({ where: { examId: exam.id, title: "MP SI Mains Set 1 — Paper 1" } });

  const user = await prisma.user.create({ data: { phone: "9990000001", name: `${TAG} user` } });
  // Grant BOTH stage pools 5 each. The paid Mains paper must draw from the MAINS pool
  // and leave the PRELIMS pool untouched (stage-scoped credits — Phase B).
  await prisma.userCredit.createMany({
    data: [
      { userId: user.id, examId: exam.id, stage: "PRELIMS", tenantId: "platform", testsRemaining: 5, testsTotalPurchased: 5 },
      { userId: user.id, examId: exam.id, stage: "MAINS", tenantId: "platform", testsRemaining: 5, testsTotalPurchased: 5 },
    ],
  });

  const created: { attemptId: string; qids: string[] }[] = [];
  try {
    // Prelims: no negative marking. Mains: 1/3 negative per wrong. Expected scores
    // are computed inside runPaper from each paper's actual pattern.
    created.push(await runPaper("PRELIMS", user.id, prelims.id, section.id));
    created.push(await runPaper("MAINS", user.id, mains.id, section.id));

    // Stage-scoped credits: the Mains attempt draws only from the MAINS pool.
    const mainsPool = await prisma.userCredit.findFirstOrThrow({ where: { userId: user.id, examId: exam.id, stage: "MAINS" } });
    const prelimsPool = await prisma.userCredit.findFirstOrThrow({ where: { userId: user.id, examId: exam.id, stage: "PRELIMS" } });
    console.log("\n▶ ENTITLEMENT (stage-scoped credits)");
    check("MAINS pool consumed by Mains attempt", mainsPool.testsRemaining, 4);
    check("PRELIMS pool untouched by Mains attempt", prelimsPool.testsRemaining, 5);
  } finally {
    // Cleanup — remove only the fixtures this run created.
    console.log("\n🧹 Cleaning up test data…");
    for (const c of created) {
      await prisma.answer.deleteMany({ where: { attemptId: c.attemptId } });
      await prisma.attempt.deleteMany({ where: { id: c.attemptId } });
    }
    await prisma.questionOption.deleteMany({ where: { question: { text: { startsWith: TAG } } } });
    await prisma.question.deleteMany({ where: { text: { startsWith: TAG } } });
    await prisma.userCredit.deleteMany({ where: { userId: user.id } });
    await prisma.attempt.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    // Put the papers back to draft (they were empty drafts before the test).
    await prisma.paper.update({ where: { id: prelims.id }, data: { isActive: false } });
    await prisma.paper.update({ where: { id: mains.id }, data: { isActive: false } });
    console.log("Cleanup done.");
  }

  console.log(`\n${ok ? "✅ E2E PASSED" : "❌ E2E FAILED"}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

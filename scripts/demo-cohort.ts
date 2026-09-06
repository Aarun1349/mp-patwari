/**
 * Proves getCohortAnalytics() — a teacher's class-at-a-glance. Seeds a tenant paper,
 * three students of different strength, runs their attempts through the real engine,
 * prints the cohort's weakest sections + at-risk students, cleans up.
 *
 *   NODE_OPTIONS="--conditions=react-server" npx tsx --env-file=.env scripts/demo-cohort.ts
 */
import { PrismaClient } from "@prisma/client";
import { startAttempt } from "../src/lib/exam/entitlement";
import { finalizeAttempt } from "../src/lib/exam/finalize";
import { getCohortAnalytics } from "../src/lib/exam/studentAnalytics";

const prisma = new PrismaClient();
const TAG = "[DEMO-COHORT]";
const SECTION_CODES = ["GK", "GS", "MATH_REASONING"];
// student -> correct-count per section (out of 3)
const STUDENTS: { name: string; plan: Record<string, number> }[] = [
  { name: "Aarti (strong)", plan: { GK: 3, GS: 3, MATH_REASONING: 2 } },
  { name: "Bhanu (medium)", plan: { GK: 2, GS: 1, MATH_REASONING: 2 } },
  { name: "Chandu (weak)", plan: { GK: 1, GS: 0, MATH_REASONING: 1 } },
];

async function main() {
  const exam = await prisma.exam.findUniqueOrThrow({ where: { slug: "mp-si" } });
  const sections = await prisma.section.findMany({ where: { examId: exam.id, code: { in: SECTION_CODES } } });
  const tenant = await prisma.tenant.create({ data: { slug: `${TAG.toLowerCase().replace(/[^a-z0-9]/g, "")}-t`, name: `${TAG} Coaching`, revenueShareBps: 7000, approved: true, isActive: true } });
  const paper = await prisma.paper.create({
    data: { title: `${TAG} Mock`, sequenceNo: 1, examId: exam.id, tenantId: tenant.id, isFree: true, isActive: true, totalQuestions: 9, totalMarks: 9, durationMinutes: 20, sourceLang: "hi" },
  });

  const qBySection: Record<string, string[]> = {};
  for (const sec of sections) {
    qBySection[sec.code] = [];
    for (let i = 0; i < 3; i++) {
      const q = await prisma.question.create({
        data: { paperId: paper.id, sectionId: sec.id, text: `${TAG} ${sec.code} Q${i}`, marks: 1, negativeMarks: 0.25,
          options: { create: [0, 1, 2, 3].map((j) => ({ label: ["A", "B", "C", "D"][j], text: `${TAG} o${j}`, isCorrect: j === 0, sortOrder: j })) } },
      });
      qBySection[sec.code].push(q.id);
    }
  }

  const studentIds: string[] = [];
  for (const s of STUDENTS) {
    const u = await prisma.user.create({ data: { phone: `99900001${studentIds.length}${studentIds.length}`, name: `${TAG} ${s.name}` } });
    studentIds.push(u.id);
    const { attemptId } = await startAttempt(u.id, paper.id);
    for (const sec of sections) {
      const qids = qBySection[sec.code];
      for (let i = 0; i < qids.length; i++) {
        const opts = await prisma.questionOption.findMany({ where: { questionId: qids[i] }, orderBy: { sortOrder: "asc" } });
        const chosen = i < s.plan[sec.code] ? opts[0].id : opts[1].id;
        await prisma.answer.create({ data: { attemptId, questionId: qids[i], selectedOptionId: chosen } });
      }
    }
    await finalizeAttempt(attemptId, "submitted");
  }

  const c = await getCohortAnalytics(tenant.id);
  console.log(`\n▶ Class Insights — ${c.studentCount} students, ${c.attemptCount} tests\n`);
  console.log("  Weakest sections (class-wide):");
  for (const r of c.sections) console.log("    " + r.nameEn.padEnd(22), `${r.accuracyPct}%`.padStart(4), `  (${r.correct}/${r.attempted})`);
  console.log("\n  Students to watch:");
  for (const s of c.atRisk) console.log("    " + s.name.replace(TAG + " ", "").padEnd(22), `${s.accuracyPct}%`);

  // Cleanup
  await prisma.answer.deleteMany({ where: { attempt: { userId: { in: studentIds } } } });
  await prisma.attempt.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.questionOption.deleteMany({ where: { question: { text: { startsWith: TAG } } } });
  await prisma.question.deleteMany({ where: { text: { startsWith: TAG } } });
  await prisma.paper.deleteMany({ where: { title: { startsWith: TAG } } });
  await prisma.user.deleteMany({ where: { id: { in: studentIds } } });
  await prisma.tenant.delete({ where: { id: tenant.id } });
  console.log("\n🧹 cleaned up.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

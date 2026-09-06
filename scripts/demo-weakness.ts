/**
 * Proves the teacher "Preparation X-ray" produces real, meaningful weakness data.
 * Seeds a demo student who is strong in some sections and weak in others, runs a
 * scored attempt through the real engine, prints getStudentSectionWeakness(), cleans up.
 *
 *   NODE_OPTIONS="--conditions=react-server" npx tsx --env-file=.env scripts/demo-weakness.ts
 */
import { PrismaClient } from "@prisma/client";
import { startAttempt } from "../src/lib/exam/entitlement";
import { finalizeAttempt } from "../src/lib/exam/finalize";
import { getStudentSectionWeakness } from "../src/lib/exam/studentAnalytics";

const prisma = new PrismaClient();
const TAG = "[DEMO-WEAK]";

// section code -> how many of its 4 questions the student answers CORRECTLY (rest wrong).
const PLAN: Record<string, number> = { GK: 3, GS: 1, MATH_REASONING: 2, MP_GK: 4 };

async function main() {
  const exam = await prisma.exam.findUniqueOrThrow({ where: { slug: "mp-si" } });
  const sections = await prisma.section.findMany({ where: { examId: exam.id, code: { in: Object.keys(PLAN) } } });
  const student = await prisma.user.create({ data: { phone: "9990000077", name: `${TAG} Ravi` } });
  const paper = await prisma.paper.create({
    data: { title: `${TAG} Mock`, sequenceNo: 1, examId: exam.id, tenantId: "platform", isFree: true, isActive: true, totalQuestions: 16, totalMarks: 16, durationMinutes: 30, sourceLang: "hi" },
  });

  // 4 questions per section, option A correct.
  const correctBySection: Record<string, string[]> = {};
  for (const sec of sections) {
    correctBySection[sec.code] = [];
    for (let i = 0; i < 4; i++) {
      const q = await prisma.question.create({
        data: { paperId: paper.id, sectionId: sec.id, text: `${TAG} ${sec.code} Q${i}`, marks: 1, negativeMarks: 0.25,
          options: { create: [0, 1, 2, 3].map((j) => ({ label: ["A", "B", "C", "D"][j], text: `${TAG} o${j}`, isCorrect: j === 0, sortOrder: j })) } },
        include: { options: true },
      });
      correctBySection[sec.code].push(q.id);
    }
  }

  const { attemptId } = await startAttempt(student.id, paper.id);
  for (const sec of sections) {
    const qids = correctBySection[sec.code];
    const nCorrect = PLAN[sec.code];
    for (let i = 0; i < qids.length; i++) {
      const opts = await prisma.questionOption.findMany({ where: { questionId: qids[i] }, orderBy: { sortOrder: "asc" } });
      const chosen = i < nCorrect ? opts[0].id : opts[1].id; // A = correct, B = wrong
      await prisma.answer.create({ data: { attemptId, questionId: qids[i], selectedOptionId: chosen } });
    }
  }
  await finalizeAttempt(attemptId, "submitted");

  const x = await getStudentSectionWeakness(student.id);
  console.log(`\n▶ Preparation X-ray for ${student.name} (${x.attemptCount} test):\n`);
  console.log("  Section".padEnd(26), "Acc%", " Correct/Att", " MarksLost");
  for (const r of x.rows) {
    console.log("  " + r.nameEn.padEnd(24), String(r.accuracyPct).padStart(4), `   ${r.correct}/${r.attempted}`.padEnd(12), `   -${r.marksLost.toFixed(2)}`);
  }
  console.log(`\n  → Weakest: ${x.rows.filter((r) => r.attempted).slice(0, 2).map((r) => `${r.nameEn} (${r.accuracyPct}%)`).join(", ")}`);

  // Cleanup
  await prisma.answer.deleteMany({ where: { attemptId } });
  await prisma.attempt.deleteMany({ where: { userId: student.id } });
  await prisma.questionOption.deleteMany({ where: { question: { text: { startsWith: TAG } } } });
  await prisma.question.deleteMany({ where: { text: { startsWith: TAG } } });
  await prisma.paper.deleteMany({ where: { title: { startsWith: TAG } } });
  await prisma.user.delete({ where: { id: student.id } });
  console.log("\n🧹 cleaned up.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

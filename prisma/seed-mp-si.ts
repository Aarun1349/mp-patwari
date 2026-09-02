import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── MP Police SI / Subedar 2026 (MPESB) — exam config + 2 free Prelims mocks ──
//
// Pattern (Prelims — the first hurdle, what the wave is preparing for):
//   100 MCQ · 120 min · NO negative marking · qualifying.
// (Mains has 2×300 papers with 1/3 negative — added later.)
//
// ⚠️ The exact per-section question split comes from the official MPESB
// notification (esb.mp.gov.in). These sections are a sensible MP-prelims default;
// tune codes/counts once the syllabus PDF is confirmed. Run once:
//   npx tsx --env-file=.env prisma/seed-mp-si.ts

// sortOrder 0 = MP SI is the DEFAULT exam (lowest sortOrder wins in getDefaultExamId()
// and shows first in the landing exam selector). MP Patwari is demoted below it in main().
const EXAM = { name: "MP Police SI / Subedar", slug: "mp-si", board: "MPESB", shortName: "MP SI", sortOrder: 0 };

const SECTIONS = [
  { code: "GK", nameEn: "General Knowledge", nameHi: "सामान्य ज्ञान", sortOrder: 1 },
  { code: "GS", nameEn: "General Science", nameHi: "सामान्य विज्ञान", sortOrder: 2 },
  { code: "MATH_REASONING", nameEn: "Maths & Reasoning", nameHi: "गणित एवं तर्कशक्ति", sortOrder: 3 },
  { code: "HINDI", nameEn: "General Hindi", nameHi: "सामान्य हिंदी", sortOrder: 4 },
  { code: "CURRENT_AFFAIRS", nameEn: "Current Affairs", nameHi: "समसामयिकी", sortOrder: 5 },
  { code: "COMPUTER", nameEn: "Computer Knowledge", nameHi: "कंप्यूटर ज्ञान", sortOrder: 6 },
  { code: "MP_GK", nameEn: "Madhya Pradesh GK", nameHi: "म.प्र. सामान्य ज्ञान", sortOrder: 7 },
];

// Two free Prelims mock shells — created as drafts (isActive:false). Upload 100
// questions to each (Excel / AI-gen in admin), then activate to go live.
const PAPERS = [
  { title: "MP SI Prelims — Free Mock 1", sequenceNo: 1 },
  { title: "MP SI Prelims — Free Mock 2", sequenceNo: 2 },
];

async function main() {
  const platform = await prisma.tenant.findUnique({ where: { id: "platform" } });
  if (!platform) throw new Error("Platform tenant missing — run the main seed first.");

  const exam = await prisma.exam.upsert({
    where: { slug: EXAM.slug },
    update: { name: EXAM.name, board: EXAM.board, shortName: EXAM.shortName, sortOrder: EXAM.sortOrder },
    create: EXAM,
  });
  console.log(`Exam: ${exam.name} (${exam.slug})`);

  // Make MP SI the default exam: demote MP Patwari below it if it exists, so
  // getDefaultExamId() (lowest active sortOrder) and the landing selector both
  // put MP SI first. No-op on a DB that never had Patwari.
  const demoted = await prisma.exam.updateMany({
    where: { slug: "mp-patwari" },
    data: { sortOrder: 5 },
  });
  if (demoted.count) console.log("Demoted MP Patwari below MP SI (sortOrder → 5).");

  for (const s of SECTIONS) {
    await prisma.section.upsert({
      where: { examId_code: { examId: exam.id, code: s.code } },
      update: s,
      create: { ...s, examId: exam.id },
    });
  }
  console.log(`Seeded ${SECTIONS.length} sections.`);

  for (const p of PAPERS) {
    const existing = await prisma.paper.findFirst({ where: { examId: exam.id, title: p.title } });
    if (existing) {
      console.log(`Paper exists, skipping: ${p.title}`);
      continue;
    }
    await prisma.paper.create({
      data: {
        title: p.title,
        sequenceNo: p.sequenceNo,
        examId: exam.id,
        tenantId: "platform",
        isFree: true,
        isActive: false, // draft — activate after uploading questions
        totalQuestions: 100,
        totalMarks: 100,
        durationMinutes: 120,
        negativeMarkingRatio: 0, // Prelims: no negative marking
        sourceLang: "hi",
      },
    });
    console.log(`Created draft mock: ${p.title} (100Q · 120min · no-negative)`);
  }

  console.log("\nMP SI seed done. Next: upload 100 questions to each mock in /admin, then activate.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

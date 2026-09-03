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

// Stage PATTERN CONFIG (ADR 0001 — exams are config, not code). Change these when a
// new MPESB notification changes the pattern; mock creation reads these defaults.
const STAGES = [
  {
    key: "PRELIMS", name: "Prelims", sortOrder: 1, papersPerSet: 1,
    defaultQuestions: 100, defaultMarks: 100, defaultDurationMinutes: 120,
    defaultNegativeRatio: 0, qualifying: true, // confirmed: 100Q/100/120min, no negative, qualifying
  },
  {
    key: "MAINS", name: "Mains", sortOrder: 2, papersPerSet: 2,
    // VALIDATED 2026-09-04: 2 papers per set, 300 marks each, 2 hours each, negative
    // marking 1/3 per wrong answer (no deduction for unattempted). Paper I = 2 sections
    // × 150 marks. Per-paper question count not stated → 100 placeholder (adjust when
    // the official notification confirms it). Technical posts add a Paper-III (300).
    defaultQuestions: 100, defaultMarks: 300, defaultDurationMinutes: 120,
    defaultNegativeRatio: 1 / 3, qualifying: false,
  },
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

  // Stage config — the source of truth for this exam's pattern (ADR 0001).
  const stageByKey: Record<string, string> = {};
  for (const st of STAGES) {
    const stage = await prisma.examStage.upsert({
      where: { examId_key: { examId: exam.id, key: st.key } },
      update: st,
      create: { ...st, examId: exam.id },
    });
    stageByKey[st.key] = stage.id;
    console.log(`Stage: ${stage.name} (${st.papersPerSet} paper/set, ${st.defaultMarks} marks, neg ${st.defaultNegativeRatio})`);
  }
  const prelimsStage = STAGES.find((s) => s.key === "PRELIMS")!;
  const mainsStage = STAGES.find((s) => s.key === "MAINS")!;

  for (const s of SECTIONS) {
    await prisma.section.upsert({
      where: { examId_code: { examId: exam.id, code: s.code } },
      update: s,
      create: { ...s, examId: exam.id },
    });
  }
  console.log(`Seeded ${SECTIONS.length} sections.`);

  // Free PRELIMS mocks — pattern comes from the Prelims stage config (config-driven).
  for (const p of PAPERS) {
    const stageLink = { stageId: stageByKey.PRELIMS, setNo: p.sequenceNo, paperNoInSet: 1 };
    const pattern = {
      totalQuestions: prelimsStage.defaultQuestions, totalMarks: prelimsStage.defaultMarks,
      durationMinutes: prelimsStage.defaultDurationMinutes, negativeMarkingRatio: prelimsStage.defaultNegativeRatio,
    };
    const existing = await prisma.paper.findFirst({ where: { examId: exam.id, title: p.title } });
    if (existing) {
      await prisma.paper.update({ where: { id: existing.id }, data: { ...stageLink, ...pattern } });
      console.log(`Prelims mock exists, refreshed from config: ${p.title}`);
      continue;
    }
    await prisma.paper.create({
      data: {
        title: p.title,
        sequenceNo: p.sequenceNo,
        examId: exam.id,
        tenantId: "platform",
        ...stageLink,
        isFree: true,
        isActive: false, // draft — activate after uploading questions
        totalQuestions: prelimsStage.defaultQuestions,
        totalMarks: prelimsStage.defaultMarks,
        durationMinutes: prelimsStage.defaultDurationMinutes,
        negativeMarkingRatio: prelimsStage.defaultNegativeRatio,
        sourceLang: "hi",
      },
    });
    console.log(`Created Prelims mock: ${p.title} (${prelimsStage.defaultMarks} marks · no-negative)`);
  }

  // One MAINS SET (Paper 1 + Paper 2) as drafts — for the end-to-end test. Both papers
  // share setNo=1; paperNoInSet orders them. Paid (isFree:false), draft until questions
  // are uploaded + activated. Pattern comes from the Mains stage config.
  const mainsSetNo = 1;
  for (let i = 1; i <= mainsStage.papersPerSet; i++) {
    const title = `MP SI Mains Set ${mainsSetNo} — Paper ${i}`;
    const stageLink = { stageId: stageByKey.MAINS, setNo: mainsSetNo, paperNoInSet: i };
    const pattern = {
      totalQuestions: mainsStage.defaultQuestions, totalMarks: mainsStage.defaultMarks,
      durationMinutes: mainsStage.defaultDurationMinutes, negativeMarkingRatio: mainsStage.defaultNegativeRatio,
    };
    const existing = await prisma.paper.findFirst({ where: { examId: exam.id, title } });
    if (existing) {
      await prisma.paper.update({ where: { id: existing.id }, data: { ...stageLink, ...pattern } });
      console.log(`Mains paper exists, refreshed from config: ${title}`);
      continue;
    }
    await prisma.paper.create({
      data: {
        title,
        sequenceNo: 100 + i,
        examId: exam.id,
        tenantId: "platform",
        ...stageLink,
        isFree: false,
        isActive: false,
        totalQuestions: mainsStage.defaultQuestions,
        totalMarks: mainsStage.defaultMarks,
        durationMinutes: mainsStage.defaultDurationMinutes,
        negativeMarkingRatio: mainsStage.defaultNegativeRatio,
        sourceLang: "hi",
      },
    });
    console.log(`Created Mains draft: ${title} (${mainsStage.defaultMarks} marks · neg ${mainsStage.defaultNegativeRatio})`);
  }

  // Paid PRELIMS package tiers (platform/house, scoped to MP SI). Prices in paise;
  // mrpPaise drives the struck-through "was ₹X". Re-running refreshes prices.
  // NOTE: Mains-set + combo (Prelims+Mains) SKUs need the stage-scoped credit model
  // (Phase B) — a single-exam package can't honestly split prelims vs mains credits.
  const PRELIMS_PACKAGES = [
    { name: "1 Prelims Mock", testCount: 1, pricePaise: 9900, mrpPaise: 0, kind: "standard" as const, validityDays: 30, sortOrder: 1 },
    { name: "5 Prelims Mocks", testCount: 5, pricePaise: 39900, mrpPaise: 44900, kind: "standard" as const, validityDays: 90, sortOrder: 2 },
    { name: "10 Prelims Mocks", testCount: 10, pricePaise: 59900, mrpPaise: 69900, kind: "standard" as const, validityDays: 120, sortOrder: 3 },
  ];
  for (const pkg of PRELIMS_PACKAGES) {
    const existing = await prisma.package.findFirst({
      where: { name: pkg.name, examId: exam.id, tenantId: "platform" },
    });
    if (existing) {
      await prisma.package.update({ where: { id: existing.id }, data: pkg });
      console.log(`Package updated: ${pkg.name} (₹${pkg.pricePaise / 100})`);
    } else {
      await prisma.package.create({ data: { ...pkg, examId: exam.id, tenantId: "platform" } });
      console.log(`Package created: ${pkg.name} (₹${pkg.pricePaise / 100})`);
    }
  }

  console.log("\nMP SI seed done. Next: upload 100 questions to each mock in /admin, then activate.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

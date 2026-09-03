/**
 * Config-driven catalog scaffold for the other MP 2026 exams (MP SI has its own
 * seed). Registers each exam's STRUCTURE only — identity + ExamStage stages +
 * subject Sections. NO mock papers and NO packages: exact per-paper patterns
 * (questions/marks/duration/negative) are TENTATIVE here and must be validated
 * against the current official MPESB/MPPSC rulebook before any real mock is built.
 * Status/dates are tracked in vault/reference/mp-exams-2026.md.
 *
 *   npx tsx --env-file=.env prisma/seed-mp-exams.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type StageCfg = {
  key: string; name: string; sortOrder: number; papersPerSet: number;
  defaultQuestions: number; defaultMarks: number; defaultDurationMinutes: number;
  defaultNegativeRatio: number; qualifying: boolean;
};
type SectionCfg = { code: string; nameEn: string; nameHi: string; sortOrder: number };
// Deep-fill (optional, added once an exam's pattern is validated): draft mocks + packages.
type MockCfg = { title: string; stageKey: string; sequenceNo: number; isFree: boolean };
type PackageCfg = { name: string; testCount: number; pricePaise: number; mrpPaise: number; kind: "standard" | "topup"; validityDays: number; sortOrder: number };
type ExamCfg = {
  slug: string; name: string; board: string; shortName: string; sortOrder: number;
  stages: StageCfg[]; sections: SectionCfg[];
  mocks?: MockCfg[]; packages?: PackageCfg[]; // present only for deep-filled (validated) exams
};

// Reusable subject building blocks.
const S = {
  GK: { code: "GK", nameEn: "General Knowledge", nameHi: "सामान्य ज्ञान" },
  HINDI: { code: "HINDI", nameEn: "General Hindi", nameHi: "सामान्य हिंदी" },
  ENGLISH: { code: "ENGLISH", nameEn: "General English", nameHi: "सामान्य अंग्रेज़ी" },
  MATH: { code: "MATH", nameEn: "General Mathematics", nameHi: "सामान्य गणित" },
  REASONING: { code: "REASONING", nameEn: "Reasoning", nameHi: "तर्कशक्ति" },
  SCIENCE: { code: "SCIENCE", nameEn: "General Science", nameHi: "सामान्य विज्ञान" },
  COMPUTER: { code: "COMPUTER", nameEn: "Computer Knowledge", nameHi: "कंप्यूटर ज्ञान" },
  CA: { code: "CURRENT_AFFAIRS", nameEn: "Current Affairs", nameHi: "समसामयिकी" },
  MP_GK: { code: "MP_GK", nameEn: "Madhya Pradesh GK", nameHi: "म.प्र. सामान्य ज्ञान" },
  GS: { code: "GENERAL_STUDIES", nameEn: "General Studies", nameHi: "सामान्य अध्ययन" },
  CSAT: { code: "CSAT", nameEn: "Aptitude (CSAT)", nameHi: "सामान्य अभिरुचि परीक्षण" },
  AGRI: { code: "AGRICULTURE", nameEn: "Agriculture", nameHi: "कृषि" },
  FORESTRY: { code: "FORESTRY", nameEn: "Forestry", nameHi: "वानिकी" },
  ENV: { code: "ENVIRONMENT", nameEn: "Environment", nameHi: "पर्यावरण" },
};
const sec = (b: { code: string; nameEn: string; nameHi: string }, sortOrder: number): SectionCfg => ({ ...b, sortOrder });

// ⚠️ All pattern figures below are TENTATIVE placeholders — validate + correct from the
// official rulebook before building/activating a real mock for the stage.
const TENTATIVE_WRITTEN = {
  papersPerSet: 1, defaultQuestions: 100, defaultMarks: 100, defaultDurationMinutes: 120,
  defaultNegativeRatio: 0, qualifying: false,
};
// Skill/descriptive stages the MCQ engine can't grade yet (typing test, descriptive Mains):
// registered as structure with zeroed pattern; do not build MCQ mocks against these.
const NON_MCQ_STAGE = { papersPerSet: 1, defaultQuestions: 0, defaultMarks: 0, defaultDurationMinutes: 0, defaultNegativeRatio: 0, qualifying: true };

// Pricing policy (founder, 2026-09-03). Single-paper (single-stage) exams: one FREE
// mock + these three bundles (no paid single). Prelims+Mains exams follow the MP SI
// model (prelims tiers + mains sets + combos) instead — configured per exam.
const SINGLE_PAPER_PACKAGES = (label: string): PackageCfg[] => [
  { name: `5 ${label}s`, testCount: 5, pricePaise: 49900, mrpPaise: 0, kind: "standard", validityDays: 90, sortOrder: 1 },
  { name: `10 ${label}s`, testCount: 10, pricePaise: 79900, mrpPaise: 0, kind: "standard", validityDays: 120, sortOrder: 2 },
  { name: `15 ${label}s`, testCount: 15, pricePaise: 119900, mrpPaise: 0, kind: "standard", validityDays: 150, sortOrder: 3 },
];

const EXAMS: ExamCfg[] = [
  {
    // DEEP-FILLED + VALIDATED (2026-09-03, mphc.gov.in reporting): written Prelims
    // 100Q/100/120min, 5 subjects × 20Q, NO negative marking (CONFIRMED — sources agree
    // the prelims MCQs carry no negative marking). Then a 50-mark Hindi typing test
    // (10 min, ~350 words, 0.5 deduction/error) — non-MCQ. No separate Mains.
    slug: "mp-hc-ag3", name: "MP High Court Assistant Grade-III", board: "MP High Court",
    shortName: "MP HC AG-III", sortOrder: 10,
    stages: [
      { key: "WRITTEN", name: "Written Exam (Prelims)", sortOrder: 1, papersPerSet: 1, defaultQuestions: 100, defaultMarks: 100, defaultDurationMinutes: 120, defaultNegativeRatio: 0, qualifying: false },
      { key: "TYPING", name: "Hindi Typing Skill Test (50 marks)", sortOrder: 2, ...NON_MCQ_STAGE }, // skill test — not an MCQ mock
    ],
    // Official 5 subjects, 20Q / 20 marks each.
    sections: [
      { code: "GK", nameEn: "General Knowledge & General Studies", nameHi: "सामान्य ज्ञान एवं सामान्य अध्ययन", sortOrder: 1 },
      { code: "MATH", nameEn: "Mathematics & Logical Reasoning", nameHi: "गणित एवं तार्किक तर्कशक्ति", sortOrder: 2 },
      sec(S.HINDI, 3), sec(S.ENGLISH, 4), sec(S.COMPUTER, 5),
    ],
    // Two free written mocks (drafts) — upload 100 questions each, then activate.
    mocks: [
      { title: "MP HC AG-III — Free Mock 1", stageKey: "WRITTEN", sequenceNo: 1, isFree: true },
      { title: "MP HC AG-III — Free Mock 2", stageKey: "WRITTEN", sequenceNo: 2, isFree: true },
    ],
    // Single-paper pricing policy: 1 free mock (above) + 5/10/15 bundles.
    packages: SINGLE_PAPER_PACKAGES("Written Mock"),
  },
  {
    slug: "mpesb-group-3", name: "MPESB Group-3 (Sub Engineer & equivalent)", board: "MPESB",
    shortName: "MPESB Group-3", sortOrder: 11,
    // Post-dependent: only the Common General section is scaffolded. Technical streams
    // (Civil/Electrical/Mechanical/Draftsman/…) are added per post/demand, per rulebook.
    stages: [{ key: "WRITTEN", name: "Written Exam", sortOrder: 1, ...TENTATIVE_WRITTEN }],
    sections: [sec(S.GK, 1), sec(S.HINDI, 2), sec(S.ENGLISH, 3), sec(S.MATH, 4), sec(S.SCIENCE, 5), sec(S.COMPUTER, 6), sec(S.CA, 7), sec(S.MP_GK, 8)],
  },
  {
    slug: "mppsc-state-service", name: "MPPSC State Service Examination", board: "MPPSC",
    shortName: "MPPSC State Service", sortOrder: 12,
    stages: [
      // Prelims: Paper I (GS) + Paper II (CSAT), each ~200 marks / 2 hours, no negative
      // per current reporting — TENTATIVE, verify official scheme. 2 papers make one set.
      { key: "PRELIMS", name: "Prelims", sortOrder: 1, papersPerSet: 2, defaultQuestions: 100, defaultMarks: 200, defaultDurationMinutes: 120, defaultNegativeRatio: 0, qualifying: true },
      { key: "MAINS", name: "Mains (descriptive)", sortOrder: 2, ...NON_MCQ_STAGE }, // descriptive — out of MCQ engine scope
    ],
    sections: [sec(S.GS, 1), sec(S.CSAT, 2), sec(S.CA, 3), sec(S.MP_GK, 4)],
  },
  {
    slug: "mpesb-group-2-sg1", name: "MPESB Group-2 Sub Group-1 / Krishi Vistar Adhikari", board: "MPESB",
    shortName: "MPESB Group-2 SG-1", sortOrder: 13,
    stages: [{ key: "WRITTEN", name: "Written Exam", sortOrder: 1, ...TENTATIVE_WRITTEN }],
    sections: [sec(S.HINDI, 1), sec(S.ENGLISH, 2), sec(S.MATH, 3), sec(S.GK, 4), sec(S.CA, 5), sec(S.COMPUTER, 6), sec(S.MP_GK, 7), sec(S.AGRI, 8)],
  },
  {
    slug: "mppsc-forest-service", name: "MPPSC State Forest Service Examination", board: "MPPSC",
    shortName: "MPPSC Forest Service", sortOrder: 14,
    stages: [
      { key: "PRELIMS", name: "Prelims", sortOrder: 1, ...TENTATIVE_WRITTEN, qualifying: true }, // often shared w/ State Service — verify
      { key: "MAINS", name: "Mains", sortOrder: 2, ...TENTATIVE_WRITTEN },
    ],
    sections: [sec(S.GS, 1), sec(S.FORESTRY, 2), sec(S.ENV, 3), sec(S.MP_GK, 4)],
  },
];

async function main() {
  for (const cfg of EXAMS) {
    const exam = await prisma.exam.upsert({
      where: { slug: cfg.slug },
      update: { name: cfg.name, board: cfg.board, shortName: cfg.shortName, sortOrder: cfg.sortOrder },
      create: { slug: cfg.slug, name: cfg.name, board: cfg.board, shortName: cfg.shortName, sortOrder: cfg.sortOrder },
    });

    const stageByKey: Record<string, { id: string } & StageCfg> = {};
    for (const st of cfg.stages) {
      const stage = await prisma.examStage.upsert({
        where: { examId_key: { examId: exam.id, key: st.key } },
        update: st,
        create: { ...st, examId: exam.id },
      });
      stageByKey[st.key] = { id: stage.id, ...st };
    }

    for (const s of cfg.sections) {
      await prisma.section.upsert({
        where: { examId_code: { examId: exam.id, code: s.code } },
        update: s,
        create: { ...s, examId: exam.id },
      });
    }
    // Prune stale sections no longer in the config, but only if empty (never drop
    // a section that already has questions).
    const keep = new Set(cfg.sections.map((s) => s.code));
    const stale = await prisma.section.findMany({
      where: { examId: exam.id, code: { notIn: [...keep] } },
      include: { _count: { select: { questions: true } } },
    });
    for (const s of stale) {
      if (s._count.questions === 0) {
        try { await prisma.section.delete({ where: { id: s.id } }); } catch { /* referenced elsewhere — leave it */ }
      }
    }

    // Deep-fill (validated exams only): draft mocks + packages.
    let mockCount = 0;
    for (const m of cfg.mocks ?? []) {
      const st = stageByKey[m.stageKey];
      if (!st) continue;
      const existing = await prisma.paper.findFirst({ where: { examId: exam.id, title: m.title } });
      const data = {
        stageId: st.id, setNo: m.sequenceNo, paperNoInSet: 1,
        totalQuestions: st.defaultQuestions, totalMarks: st.defaultMarks,
        durationMinutes: st.defaultDurationMinutes, negativeMarkingRatio: st.defaultNegativeRatio,
      };
      if (existing) {
        await prisma.paper.update({ where: { id: existing.id }, data });
      } else {
        await prisma.paper.create({
          data: { title: m.title, sequenceNo: m.sequenceNo, examId: exam.id, tenantId: "platform", isFree: m.isFree, isActive: false, sourceLang: "hi", ...data },
        });
      }
      mockCount++;
    }

    let pkgCount = 0;
    for (const pkg of cfg.packages ?? []) {
      const existing = await prisma.package.findFirst({ where: { name: pkg.name, examId: exam.id, tenantId: "platform" } });
      if (existing) await prisma.package.update({ where: { id: existing.id }, data: { ...pkg, isActive: true } });
      else await prisma.package.create({ data: { ...pkg, examId: exam.id, tenantId: "platform", isActive: true } });
      pkgCount++;
    }
    // Retire platform packages no longer in the config (deactivate, never delete —
    // orders reference packages). Keeps the buy page in sync with the current policy.
    if (cfg.packages) {
      const keepPkg = new Set(cfg.packages.map((p) => p.name));
      await prisma.package.updateMany({
        where: { examId: exam.id, tenantId: "platform", name: { notIn: [...keepPkg] }, isActive: true },
        data: { isActive: false },
      });
    }

    const deep = cfg.mocks ? ` · ${mockCount} mock(s) · ${pkgCount} package(s) [VALIDATED]` : " [patterns TENTATIVE]";
    console.log(`✔ ${cfg.name} — ${cfg.stages.length} stage(s), ${cfg.sections.length} section(s)${deep}`);
  }
  console.log("\nCatalog seed done. Exams without mocks still need pattern validation from their official rulebook.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

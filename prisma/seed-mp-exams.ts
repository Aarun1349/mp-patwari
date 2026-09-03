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
type ExamCfg = {
  slug: string; name: string; board: string; shortName: string; sortOrder: number;
  stages: StageCfg[]; sections: SectionCfg[];
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

const EXAMS: ExamCfg[] = [
  {
    slug: "mp-hc-ag3", name: "MP High Court Assistant Grade-III", board: "MP High Court",
    shortName: "MP HC AG-III", sortOrder: 10,
    stages: [
      { key: "WRITTEN", name: "Written Exam", sortOrder: 1, ...TENTATIVE_WRITTEN },
      { key: "TYPING", name: "Hindi Typing Skill Test", sortOrder: 2, ...NON_MCQ_STAGE }, // skill test — not an MCQ mock
    ],
    sections: [sec(S.GK, 1), sec(S.HINDI, 2), sec(S.ENGLISH, 3), sec(S.MATH, 4), sec(S.COMPUTER, 5), sec(S.MP_GK, 6)],
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
    for (const st of cfg.stages) {
      await prisma.examStage.upsert({
        where: { examId_key: { examId: exam.id, key: st.key } },
        update: st,
        create: { ...st, examId: exam.id },
      });
    }
    for (const s of cfg.sections) {
      await prisma.section.upsert({
        where: { examId_code: { examId: exam.id, code: s.code } },
        update: s,
        create: { ...s, examId: exam.id },
      });
    }
    console.log(`✔ ${cfg.name} — ${cfg.stages.length} stage(s), ${cfg.sections.length} section(s) [patterns TENTATIVE]`);
  }
  console.log("\nCatalog scaffold done. Validate each exam's pattern from its official rulebook before building mocks.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

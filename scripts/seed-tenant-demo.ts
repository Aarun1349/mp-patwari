// Demo-tenant seed for the marketplace slice. Idempotent.
// Creates: MP TET exam + sections, a demo tenant "Ravi Sir – Maths" with a
// partner login, a tenant-owned Maths paper (+ questions), and a tenant package.
// Usage: npx tsx --env-file=.env scripts/seed-tenant-demo.ts
//
// Standalone (no server-only imports) — mirrors scripts/create-admin.ts.
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCb);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

const TET_SECTIONS = [
  { code: "MATH", nameEn: "Mathematics", nameHi: "गणित", sortOrder: 1 },
  { code: "PEDAGOGY", nameEn: "Child Development & Pedagogy", nameHi: "बाल विकास एवं शिक्षाशास्त्र", sortOrder: 2 },
  { code: "GK", nameEn: "General Knowledge", nameHi: "सामान्य ज्ञान", sortOrder: 3 },
];

// A few real Maths questions (correct option marked) for the demo paper.
const MATH_QUESTIONS = [
  { text: "What is the LCM of 12 and 18?", options: ["36", "72", "6", "18"], correct: 0 },
  { text: "If 20% of a number is 50, what is the number?", options: ["100", "200", "250", "500"], correct: 2 },
  { text: "A train travels 240 km in 4 hours. Its average speed is:", options: ["50 km/h", "60 km/h", "48 km/h", "80 km/h"], correct: 1 },
  { text: "The simple interest on ₹1000 at 5% per annum for 2 years is:", options: ["₹50", "₹100", "₹150", "₹200"], correct: 1 },
  { text: "The area of a rectangle 8 cm by 5 cm is:", options: ["13 cm²", "40 cm²", "26 cm²", "20 cm²"], correct: 1 },
];

async function main() {
  const partnerRole = await prisma.role.findUnique({ where: { key: "partner" } });
  if (!partnerRole) throw new Error("Run `npm run db:seed` first — 'partner' role not found.");

  // 1) MP TET exam + sections (platform-owned catalog).
  const exam = await prisma.exam.upsert({
    where: { slug: "mp-tet-varg-2" },
    update: {},
    create: { name: "MP TET Varg 2", slug: "mp-tet-varg-2", board: "MPESB", shortName: "MP TET", sortOrder: 1 },
  });
  const sectionByCode = new Map<string, string>();
  for (const s of TET_SECTIONS) {
    const section = await prisma.section.upsert({
      where: { examId_code: { examId: exam.id, code: s.code } },
      update: s,
      create: { ...s, examId: exam.id },
    });
    sectionByCode.set(s.code, section.id);
  }

  // 2) Demo tenant + partner login.
  const tenant = await prisma.tenant.upsert({
    where: { slug: "ravi-sir" },
    update: {},
    create: {
      slug: "ravi-sir",
      name: "Ravi Sir – Maths",
      ownerName: "Ravi Kumar",
      tagline: "MP TET Maths, made simple.",
      bio: "10+ years coaching MP TET Maths aspirants.",
      revenueShareBps: 7000, // 70% to the teacher, 30% platform
      approved: true,
      onboardedBy: "seed",
    },
  });

  const partnerEmail = process.env.PARTNER_EMAIL?.trim().toLowerCase() ?? "ravi@example.com";
  const partnerPassword = process.env.PARTNER_PASSWORD ?? "ravimaths-dev-123";
  await prisma.adminUser.upsert({
    where: { email: partnerEmail },
    update: { roleId: partnerRole.id, tenantId: tenant.id },
    create: {
      email: partnerEmail,
      passwordHash: await hashPassword(partnerPassword),
      name: "Ravi Kumar",
      roleId: partnerRole.id,
      tenantId: tenant.id,
    },
  });

  // 3) Tenant-owned Maths paper (+ questions).
  const existingPaper = await prisma.paper.findFirst({
    where: { tenantId: tenant.id, examId: exam.id, title: "Ravi Sir – Maths Mock 01" },
  });
  if (!existingPaper) {
    const maxSeq = await prisma.paper.aggregate({ _max: { sequenceNo: true } });
    const paper = await prisma.paper.create({
      data: {
        title: "Ravi Sir – Maths Mock 01",
        sequenceNo: (maxSeq._max.sequenceNo ?? 0) + 1,
        isFree: false,
        totalQuestions: MATH_QUESTIONS.length,
        totalMarks: MATH_QUESTIONS.length,
        durationMinutes: 120,
        examId: exam.id,
        tenantId: tenant.id,
      },
    });
    const mathSectionId = sectionByCode.get("MATH")!;
    for (const q of MATH_QUESTIONS) {
      await prisma.question.create({
        data: {
          paperId: paper.id,
          sectionId: mathSectionId,
          text: q.text,
          marks: 1,
          options: {
            create: q.options.map((text, idx) => ({
              label: ["A", "B", "C", "D"][idx],
              text,
              isCorrect: idx === q.correct,
              sortOrder: idx,
            })),
          },
        },
      });
    }
    console.log(`Created tenant paper "${paper.title}" with ${MATH_QUESTIONS.length} questions.`);
  }

  // 4) Tenant package.
  const existingPkg = await prisma.package.findFirst({ where: { tenantId: tenant.id, name: "Ravi Sir Maths – 5 Tests" } });
  if (!existingPkg) {
    await prisma.package.create({
      data: {
        name: "Ravi Sir Maths – 5 Tests",
        testCount: 5,
        pricePaise: 29900,
        kind: "standard",
        validityDays: 90,
        sortOrder: 1,
        examId: exam.id,
        tenantId: tenant.id,
      },
    });
    console.log("Created tenant package.");
  }

  console.log(`Done. Tenant "${tenant.name}" (/t/${tenant.slug}), partner login: ${partnerEmail}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

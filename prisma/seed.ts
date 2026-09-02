import { PrismaClient, RoleScope } from "@prisma/client";

const prisma = new PrismaClient();

// System roles (data-driven RBAC). `admin` has the "*" wildcard = full
// authority; the rest are explicitly limited. New roles (sales, marketing,
// finance/GST, …) can be added later as plain rows — no schema change.
const SYSTEM_ROLES = [
  { key: "admin", name: "Admin", scope: RoleScope.platform, permissions: ["*"] },
  {
    key: "sub_admin",
    name: "Sub-admin",
    scope: RoleScope.platform,
    permissions: [
      "tenant.read",
      "tenant.onboard",
      "student.read",
      "order.read",
      "grievance.manage",
      "notification.broadcast",
    ],
  },
  {
    key: "partner",
    name: "Partner (Teacher)",
    scope: RoleScope.tenant,
    permissions: [
      "paper.manage.own",
      "package.manage.own",
      "question.manage.own",
      "student.read.own",
      "revenue.read.own",
      "notification.send.own",
    ],
  },
  {
    key: "creator",
    name: "Creator",
    scope: RoleScope.tenant,
    permissions: ["question.manage.own", "blog.manage"],
  },
];

// Fixed MP Patwari exam sections — hardcoded, not a configurable taxonomy.
const SECTIONS = [
  { code: "GK", nameEn: "General Knowledge", nameHi: "सामान्य ज्ञान", sortOrder: 1 },
  { code: "MATH_REASONING", nameEn: "General Math & Reasoning", nameHi: "सामान्य गणित एवं रीज़निंग", sortOrder: 2 },
  { code: "HINDI", nameEn: "General Hindi", nameHi: "सामान्य हिंदी", sortOrder: 3 },
  { code: "ENGLISH", nameEn: "General English", nameHi: "सामान्य अंग्रेज़ी", sortOrder: 4 },
  { code: "COMPUTER", nameEn: "Computer Knowledge", nameHi: "कंप्यूटर ज्ञान", sortOrder: 5 },
  { code: "RURAL_ECONOMY", nameEn: "Rural Economy & Panchayati Raj", nameHi: "ग्रामीण अर्थव्यवस्था एवं पंचायती राज", sortOrder: 6 },
];

// Supported languages are data — enable a new one by adding a row (no schema or
// code change). English + Hindi active now. See Decisions/0006-multi-language-content.
const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", sortOrder: 1 },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", sortOrder: 2 },
];

async function main() {
  // The platform is itself a tenant with a fixed id. Every Paper/Package/Order/
  // UserCredit defaults its tenantId to "platform", so platform-owned content
  // (and all pre-marketplace rows) has a real owner and credit/entitlement
  // checks never special-case null. Teacher tenants are separate rows.
  await prisma.tenant.upsert({
    where: { id: "platform" },
    update: {},
    create: {
      id: "platform",
      slug: "platform",
      name: "ExamsExpress",
      ownerName: "ExamsExpress",
      approved: true,
      revenueShareBps: 0,
    },
  });
  console.log("Seeded platform tenant.");

  for (const r of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, scope: r.scope, permissions: r.permissions, isSystem: true },
      create: { key: r.key, name: r.name, scope: r.scope, permissions: r.permissions, isSystem: true },
    });
  }
  console.log(`Seeded ${SYSTEM_ROLES.length} system roles.`);

  for (const lang of LANGUAGES) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: { name: lang.name, nativeName: lang.nativeName, sortOrder: lang.sortOrder },
      create: { ...lang, isActive: true },
    });
  }
  console.log(`Seeded ${LANGUAGES.length} languages.`);

  // The MP Patwari exam that all seeded content belongs to.
  const exam = await prisma.exam.upsert({
    where: { slug: "mp-patwari" },
    update: {},
    // sortOrder 5 keeps MP Patwari below MP SI, which is the default exam (sortOrder 0,
    // set by seed-mp-si.ts). On a fresh DB where only this seed runs, Patwari is the
    // sole exam and is the default regardless.
    create: { name: "MP Patwari", slug: "mp-patwari", board: "MPESB", shortName: "Patwari", sortOrder: 5 },
  });
  const examId = exam.id;

  for (const section of SECTIONS) {
    await prisma.section.upsert({
      where: { examId_code: { examId, code: section.code } },
      update: section,
      create: { ...section, examId },
    });
  }
  console.log(`Seeded ${SECTIONS.length} sections.`);

  // Placeholder package tiers — client confirmed final pricing is TBD;
  // update via admin/DB before Phase 3 checkout goes live.
  const packages = [
    { name: "Starter", testCount: 5, pricePaise: 39900, kind: "standard" as const, validityDays: 60, sortOrder: 1 },
    { name: "Value", testCount: 7, pricePaise: 54900, kind: "standard" as const, validityDays: 75, sortOrder: 2 },
    { name: "Popular", testCount: 10, pricePaise: 79900, kind: "standard" as const, validityDays: 90, sortOrder: 3 },
    { name: "Pro", testCount: 20, pricePaise: 149900, kind: "standard" as const, validityDays: 120, sortOrder: 4 },
    { name: "Top-up 5", testCount: 5, pricePaise: 29900, kind: "topup" as const, validityDays: 60, sortOrder: 5 },
  ];
  for (const pkg of packages) {
    const existing = await prisma.package.findFirst({ where: { name: pkg.name } });
    if (!existing) {
      await prisma.package.create({ data: { ...pkg, examId } });
    }
  }
  console.log(`Seeded ${packages.length} packages (placeholder pricing).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

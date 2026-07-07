import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fixed MP Patwari exam sections — hardcoded, not a configurable taxonomy.
const SECTIONS = [
  { code: "GK", nameEn: "General Knowledge", nameHi: "सामान्य ज्ञान", sortOrder: 1 },
  { code: "MATH_REASONING", nameEn: "General Math & Reasoning", nameHi: "सामान्य गणित एवं रीज़निंग", sortOrder: 2 },
  { code: "HINDI", nameEn: "General Hindi", nameHi: "सामान्य हिंदी", sortOrder: 3 },
  { code: "ENGLISH", nameEn: "General English", nameHi: "सामान्य अंग्रेज़ी", sortOrder: 4 },
  { code: "COMPUTER", nameEn: "Computer Knowledge", nameHi: "कंप्यूटर ज्ञान", sortOrder: 5 },
  { code: "RURAL_ECONOMY", nameEn: "Rural Economy & Panchayati Raj", nameHi: "ग्रामीण अर्थव्यवस्था एवं पंचायती राज", sortOrder: 6 },
];

async function main() {
  for (const section of SECTIONS) {
    await prisma.section.upsert({
      where: { code: section.code },
      update: section,
      create: section,
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
      await prisma.package.create({ data: pkg });
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

// Seeds a PLATFORM-owned free MP TET Varg 2 Mathematics mock ("Mock 01").
// Idempotent. Run on dev now, and on prod (with prod DATABASE_URL) after the
// tenant migration. Questions are teacher-eligibility level (elementary/secondary
// arithmetic, mensuration, algebra) with hand-verified answers.
// Usage: npx tsx --env-file=.env scripts/seed-mptet-maths-mock.ts
//
// NOTE: have a subject teacher spot-check before this goes live — exam-prep trust
// depends on 100% correct keys. Hindi renders via the admin "pre-translate" pass.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PAPER_TITLE = "MP TET Varg 2 – Mathematics Mock 01";

// [question, [A, B, C, D], correctIndex]
const QUESTIONS: [string, [string, string, string, string], number][] = [
  ["The LCM of 12 and 18 is:", ["36", "72", "6", "216"], 0],
  ["The HCF of 24 and 36 is:", ["12", "6", "72", "8"], 0],
  ["25% of 240 is:", ["60", "48", "96", "40"], 0],
  ["If 15% of a number is 45, the number is:", ["300", "250", "675", "150"], 0],
  ["In the ratio 2 : 3, if the first term is 40, the second term is:", ["60", "50", "80", "45"], 0],
  ["The average of 10, 20, 30, 40 and 50 is:", ["30", "25", "35", "150"], 0],
  ["A train covers 240 km in 4 hours. Its average speed is:", ["60 km/h", "50 km/h", "48 km/h", "80 km/h"], 0],
  ["The simple interest on ₹2000 at 5% per annum for 3 years is:", ["₹300", "₹100", "₹250", "₹350"], 0],
  ["The area of a rectangle 12 cm by 5 cm is:", ["60 cm²", "34 cm²", "17 cm²", "120 cm²"], 0],
  ["The perimeter of a square of side 7 cm is:", ["28 cm", "49 cm", "14 cm", "21 cm"], 0],
  ["3/4 + 1/4 = ?", ["1", "1/2", "3/4", "2"], 0],
  ["0.5 × 0.2 = ?", ["0.1", "0.7", "1.0", "0.01"], 0],
  ["Simplify: 12 + 6 ÷ 2", ["15", "9", "18", "12"], 0],
  ["If 5x = 45, then x is:", ["9", "40", "50", "8"], 0],
  ["An article bought for ₹200 is sold for ₹250. The profit percent is:", ["25%", "20%", "50%", "30%"], 0],
  ["An article bought for ₹500 is sold for ₹400. The loss percent is:", ["20%", "25%", "100%", "10%"], 0],
  ["If A can finish a work in 10 days, his one day's work is:", ["1/10", "10", "1/5", "1/20"], 0],
  ["A can do a work in 10 days and B in 15 days. Working together they finish it in:", ["6 days", "5 days", "25 days", "12 days"], 0],
  ["The compound interest on ₹1000 at 10% per annum for 2 years is:", ["₹210", "₹200", "₹100", "₹121"], 0],
  ["Find the next term: 2, 4, 6, 8, ?", ["10", "12", "9", "16"], 0],
  ["Find the next term: 1, 4, 9, 16, ?", ["25", "20", "24", "36"], 0],
  ["Find the next term: 3, 6, 12, 24, ?", ["48", "36", "30", "72"], 0],
  ["144 ÷ 12 = ?", ["12", "11", "13", "24"], 0],
  ["√169 = ?", ["13", "12", "14", "17"], 0],
  ["√144 = ?", ["12", "14", "11", "13"], 0],
  ["2³ = ?", ["8", "6", "9", "4"], 0],
  ["15 × 8 = ?", ["120", "115", "125", "105"], 0],
  ["1 hour is equal to how many minutes?", ["60", "100", "24", "3600"], 0],
  ["A shopkeeper marks an item 20% above its cost price of ₹500. The marked price is:", ["₹600", "₹520", "₹550", "₹480"], 0],
  ["Express 1/5 as a percentage:", ["20%", "15%", "25%", "5%"], 0],
  ["0.25 as a fraction is:", ["1/4", "1/2", "2/5", "1/5"], 0],
  ["The sum of the interior angles of a triangle is:", ["180°", "360°", "90°", "270°"], 0],
  ["The area of a circle of radius 7 cm (π = 22/7) is:", ["154 cm²", "44 cm²", "22 cm²", "49 cm²"], 0],
  ["The circumference of a circle of radius 7 cm (π = 22/7) is:", ["44 cm", "154 cm", "22 cm", "88 cm"], 0],
  ["The volume of a cube of side 3 cm is:", ["27 cm³", "9 cm³", "18 cm³", "12 cm³"], 0],
  ["If a : b = 2 : 3 and b : c = 4 : 5, then a : c is:", ["8 : 15", "2 : 5", "8 : 12", "10 : 15"], 0],
  ["The average of the first five natural numbers is:", ["3", "2.5", "5", "15"], 0],
  ["A pipe fills a tank in 6 hours. The part filled in 2 hours is:", ["1/3", "1/6", "2/3", "3"], 0],
  ["Two pipes fill a tank in 4 hours and 6 hours. Together they fill it in:", ["2.4 hours", "5 hours", "10 hours", "2 hours"], 0],
  ["A 10% discount is given on an item priced ₹800. The amount payable is:", ["₹720", "₹80", "₹780", "₹700"], 0],
  ["7 × 6 + 3 = ?", ["45", "63", "42", "48"], 0],
  ["The smallest prime number greater than 7 is:", ["11", "9", "10", "13"], 0],
  ["The remainder when 15 is divided by 4 is:", ["3", "1", "2", "0"], 0],
  ["3.5 + 2.75 = ?", ["6.25", "6.75", "5.25", "6.15"], 0],
  ["10% of 10% of 1000 is:", ["10", "100", "1", "20"], 0],
  ["12 apples cost ₹60. The cost of one apple is:", ["₹5", "₹6", "₹4", "₹72"], 0],
  ["The perimeter of a rectangle 8 cm by 3 cm is:", ["22 cm", "24 cm", "11 cm", "40 cm"], 0],
  ["If x + 5 = 12, then x is:", ["7", "17", "5", "60"], 0],
  ["3/5 of 100 is:", ["60", "35", "53", "40"], 0],
  ["At 10% simple interest per annum, a sum doubles itself in:", ["10 years", "20 years", "5 years", "100 years"], 0],
];

const LABELS = ["A", "B", "C", "D"];

// Shuffle the correct answer off position A so the key isn't always "A".
function placeOptions(options: [string, string, string, string], correctIndex: number) {
  const correctText = options[correctIndex];
  // deterministic spread: rotate by the question's option content length
  const rot = correctText.length % 4;
  const arranged = [...options.slice(rot), ...options.slice(0, rot)];
  return arranged.map((text, idx) => ({
    label: LABELS[idx],
    text,
    isCorrect: text === correctText,
    sortOrder: idx,
  }));
}

async function main() {
  const exam = await prisma.exam.upsert({
    where: { slug: "mp-tet-varg-2" },
    update: {},
    create: { name: "MP TET Varg 2", slug: "mp-tet-varg-2", board: "MPESB", shortName: "MP TET", sortOrder: 1 },
  });

  const section = await prisma.section.upsert({
    where: { examId_code: { examId: exam.id, code: "MATH" } },
    update: {},
    create: { code: "MATH", nameEn: "Mathematics", nameHi: "गणित", sortOrder: 1, examId: exam.id },
  });

  const existing = await prisma.paper.findFirst({ where: { examId: exam.id, title: PAPER_TITLE } });
  if (existing) {
    console.log(`Paper "${PAPER_TITLE}" already exists (${existing.id}). Nothing to do.`);
    return;
  }

  const maxSeq = await prisma.paper.aggregate({ _max: { sequenceNo: true } });
  const paper = await prisma.paper.create({
    data: {
      title: PAPER_TITLE,
      sequenceNo: (maxSeq._max.sequenceNo ?? 0) + 1,
      isFree: true, // first free mock = acquisition engine
      totalQuestions: QUESTIONS.length,
      totalMarks: QUESTIONS.length,
      durationMinutes: 120,
      examId: exam.id,
      // tenantId defaults to "platform" (platform-owned)
    },
  });

  for (const [text, options, correctIndex] of QUESTIONS) {
    await prisma.question.create({
      data: {
        paperId: paper.id,
        sectionId: section.id,
        text,
        marks: 1,
        options: { create: placeOptions(options, correctIndex) },
      },
    });
  }

  console.log(`Created FREE paper "${PAPER_TITLE}" with ${QUESTIONS.length} questions (id ${paper.id}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

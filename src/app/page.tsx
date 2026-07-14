import { prisma } from "@/lib/prisma";
import { LandingClient } from "./LandingClient";

// Pricing + exam list are DB-driven. Render dynamically so the production build
// never depends on the database schema/data being ready at build time.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [packages, exams, livePaperExamIds] = await Promise.all([
    prisma.package.findMany({
      where: { isActive: true, kind: "standard" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, pricePaise: true, testCount: true, validityDays: true },
    }),
    prisma.exam.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, board: true },
    }),
    prisma.paper.findMany({ where: { isActive: true }, select: { examId: true }, distinct: ["examId"] }),
  ]);

  // An exam is "live" once it has at least one active paper; the rest show as
  // coming soon so the landing conveys the full platform scope.
  const liveExamIds = new Set(livePaperExamIds.map((p) => p.examId));
  const examCards = exams.map((e) => ({ ...e, live: liveExamIds.has(e.id) }));

  return <LandingClient packages={packages} exams={examCards} />;
}

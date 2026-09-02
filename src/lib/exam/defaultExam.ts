import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * The exam to attribute newly-created content to until the admin UI lets you
 * pick one explicitly (Phase 2). Returns the active exam with the lowest
 * sortOrder — currently MP SI / Subedar (the default). Once creation flows let
 * an admin choose, they should take an explicit examId instead of relying on this.
 */
export async function getDefaultExamId(): Promise<string> {
  const exam = await prisma.exam.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!exam) throw new Error("No active exam configured — create one first.");
  return exam.id;
}

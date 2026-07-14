import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/session";
import { loadOwnedAttempt } from "@/lib/exam/attemptAccess";
import { NON_TRANSLATABLE_SECTION_CODES } from "@/lib/ai/translate";
import { prisma } from "@/lib/prisma";

/**
 * Bulk-loads the whole paper for an attempt in ONE request — every question in
 * this attempt's shuffled order, both languages (original + cached alt), each
 * question's shuffled option order, and the student's saved answers.
 *
 * The exam room fetches this once on mount and then serves all navigation,
 * section jumps, and language toggles from client state — no per-question round
 * trips (which on a deployed server showed up as render lag and transient
 * "network error"s mid-exam). Only served while the attempt is in progress and
 * only to its owner.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/exam/[attemptId]/paper">) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { attemptId } = await ctx.params;
  const attempt = await loadOwnedAttempt(attemptId, session.userId);
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ status: attempt.status }, { status: 409 });
  }

  const questionOrder = attempt.questionOrder as string[];
  const optionOrderMap = (attempt.optionOrder as Record<string, string[]>) ?? {};

  const [questions, answers] = await Promise.all([
    prisma.question.findMany({
      where: { id: { in: questionOrder }, paperId: attempt.paperId, isActive: true },
      select: {
        id: true,
        text: true,
        textAlt: true,
        section: { select: { code: true, nameEn: true, nameHi: true } },
        options: { select: { id: true, label: true, text: true, textAlt: true } },
      },
    }),
    prisma.answer.findMany({
      where: { attemptId },
      select: { questionId: true, selectedOptionId: true, markedForReview: true },
    }),
  ]);

  const qById = new Map(questions.map((q) => [q.id, q]));
  const ansById = new Map(answers.map((a) => [a.questionId, a]));

  const items = questionOrder
    .map((questionId, index) => {
      const q = qById.get(questionId);
      if (!q) return null;

      const optById = new Map(q.options.map((o) => [o.id, o]));
      const orderedOptions = (optionOrderMap[questionId] ?? q.options.map((o) => o.id))
        .map((id) => optById.get(id))
        .filter((o): o is NonNullable<typeof o> => Boolean(o))
        .map((o) => ({ id: o.id, label: o.label, text: o.text, textAlt: o.textAlt }));

      const ans = ansById.get(questionId);
      return {
        index,
        questionId: q.id,
        section: q.section,
        translatable: !NON_TRANSLATABLE_SECTION_CODES.has(q.section.code),
        text: q.text,
        textAlt: q.textAlt,
        options: orderedOptions,
        selectedOptionId: ans?.selectedOptionId ?? null,
        markedForReview: ans?.markedForReview ?? false,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return NextResponse.json({ total: questionOrder.length, questions: items });
}

import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/session";
import { loadOwnedAttempt } from "@/lib/exam/attemptAccess";
import { checkRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { translateQuestion, NON_TRANSLATABLE_SECTION_CODES } from "@/lib/ai/translate";
import { GroqApiError } from "@/lib/ai/groq";

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/exam/[attemptId]/question/[index]">
) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { attemptId, index: indexParam } = await ctx.params;
  const wantsAlt = new URL(req.url).searchParams.get("lang") === "alt";

  const attempt = await loadOwnedAttempt(attemptId, session.userId);
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (attempt.status !== "in_progress") {
    return NextResponse.json({ status: attempt.status }, { status: 409 });
  }

  const { allowed } = await checkRateLimit(`exam:q:${attemptId}`, { windowSeconds: 10, max: 30 });
  if (!allowed) {
    await prisma.attempt.update({ where: { id: attemptId }, data: { flagged: true } });
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const questionOrder = attempt.questionOrder as string[];
  const index = Number(indexParam);
  if (!Number.isInteger(index) || index < 0 || index >= questionOrder.length) {
    return NextResponse.json({ error: "index out of range" }, { status: 400 });
  }

  const questionId = questionOrder[index];
  const optionOrder = (attempt.optionOrder as Record<string, string[]>)[questionId] ?? [];

  const [question, existingAnswer] = await Promise.all([
    prisma.question.findFirst({
      where: { id: questionId, paperId: attempt.paperId, isActive: true },
      select: {
        id: true,
        text: true,
        textAlt: true,
        section: { select: { code: true, nameEn: true, nameHi: true } },
        options: { select: { id: true, label: true, text: true, textAlt: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.answer.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    }),
  ]);

  if (!question) return NextResponse.json({ error: "question not found" }, { status: 404 });

  const translatable = !NON_TRANSLATABLE_SECTION_CODES.has(question.section.code);

  let text = question.text;
  let optionsById = new Map(question.options.map((o) => [o.id, { id: o.id, label: o.label, text: o.text }]));

  if (wantsAlt && translatable) {
    const missingAlt = !question.textAlt || question.options.some((o) => !o.textAlt);
    if (missingAlt) {
      try {
        const translated = await translateQuestion(
          question.text,
          question.options.map((o) => o.text)
        );
        await prisma.$transaction([
          prisma.question.update({ where: { id: question.id }, data: { textAlt: translated.text } }),
          ...question.options.map((o, i) =>
            prisma.questionOption.update({ where: { id: o.id }, data: { textAlt: translated.options[i] } })
          ),
        ]);
        text = translated.text;
        optionsById = new Map(
          question.options.map((o, i) => [o.id, { id: o.id, label: o.label, text: translated.options[i] }])
        );
      } catch (err) {
        // Translation failure shouldn't block the exam — fall back to the
        // original language silently (client just won't see the toggle take effect).
        if (!(err instanceof GroqApiError)) console.error("translateQuestion failed", err);
      }
    } else {
      text = question.textAlt!;
      optionsById = new Map(
        question.options.map((o) => [o.id, { id: o.id, label: o.label, text: o.textAlt! }])
      );
    }
  }

  const orderedOptions = optionOrder
    .map((id) => optionsById.get(id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  return NextResponse.json({
    index,
    total: questionOrder.length,
    questionId: question.id,
    section: question.section,
    text,
    options: orderedOptions,
    translatable,
    selectedOptionId: existingAnswer?.selectedOptionId ?? null,
    markedForReview: existingAnswer?.markedForReview ?? false,
  });
}

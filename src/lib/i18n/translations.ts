import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Multi-language content resolution. The source text lives on Question.text /
 * QuestionOption.text (in Paper.sourceLang); every other language is a cached
 * row in QuestionTranslation / OptionTranslation. Reads fall back to the source
 * text when a translation is missing, so the exam NEVER blocks on a missing
 * translation. See Decisions/0006-multi-language-content.
 */

interface Translatable {
  text: string;
  translations: { lang: string; text: string }[];
}
interface QuestionWithTranslations extends Translatable {
  options: (Translatable & { id: string })[];
}

function pick(source: string, translations: { lang: string; text: string }[], lang: string, sourceLang: string) {
  if (lang === sourceLang) return source;
  return translations.find((t) => t.lang === lang)?.text ?? source;
}

/** Resolve a question (+ options) into `lang`, falling back to the source text. */
export function resolveQuestion(q: QuestionWithTranslations, lang: string, sourceLang: string) {
  return {
    text: pick(q.text, q.translations, lang, sourceLang),
    options: q.options.map((o) => ({ id: o.id, text: pick(o.text, o.translations, lang, sourceLang) })),
  };
}

/** Cache a question's text in a language (used by the pre-translate job — phase 2). */
export function upsertQuestionTranslation(questionId: string, lang: string, text: string) {
  return prisma.questionTranslation.upsert({
    where: { questionId_lang: { questionId, lang } },
    create: { questionId, lang, text },
    update: { text },
  });
}

/** Cache an option's text in a language. */
export function upsertOptionTranslation(optionId: string, lang: string, text: string) {
  return prisma.optionTranslation.upsert({
    where: { optionId_lang: { optionId, lang } },
    create: { optionId, lang, text },
    update: { text },
  });
}

/** How many of a paper's active questions still lack a cached translation for a
 *  language — powers the per-language "X pending" status shown to teachers. */
export async function pendingTranslationCount(paperId: string, lang: string): Promise<number> {
  const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { sourceLang: true } });
  if (!paper || paper.sourceLang === lang) return 0;
  return prisma.question.count({
    where: {
      paperId,
      isActive: true,
      translations: { none: { lang } },
    },
  });
}

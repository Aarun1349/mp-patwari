import "server-only";
import { randomInt } from "node:crypto";

function fisherYates<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

interface QuestionWithOptions {
  id: string;
  sectionId: string;
  options: { id: string }[];
}

export interface AttemptShuffle {
  questionOrder: string[];
  optionOrder: Record<string, string[]>;
}

/**
 * Per-attempt shuffle: questions are shuffled *within* each section, but
 * sections themselves stay in their canonical order (sectionSortOrder) —
 * subjects appear as contiguous blocks (all GK, then all Math & Reasoning,
 * etc.), matching how a real exam is laid out, rather than being interleaved
 * across the whole paper. Option order is still fully shuffled per question.
 */
export function shuffleAttempt(
  questions: QuestionWithOptions[],
  sectionSortOrder: Record<string, number>
): AttemptShuffle {
  const bySection = new Map<string, QuestionWithOptions[]>();
  for (const q of questions) {
    const list = bySection.get(q.sectionId);
    if (list) list.push(q);
    else bySection.set(q.sectionId, [q]);
  }

  const orderedSectionIds = [...bySection.keys()].sort(
    (a, b) => (sectionSortOrder[a] ?? 0) - (sectionSortOrder[b] ?? 0)
  );

  const questionOrder: string[] = [];
  const optionOrder: Record<string, string[]> = {};

  for (const sectionId of orderedSectionIds) {
    const sectionQuestions = bySection.get(sectionId)!;
    fisherYates(sectionQuestions);
    for (const question of sectionQuestions) {
      questionOrder.push(question.id);
      const optionIds = question.options.map((o) => o.id);
      fisherYates(optionIds);
      optionOrder[question.id] = optionIds;
    }
  }

  return { questionOrder, optionOrder };
}

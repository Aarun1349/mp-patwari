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
  options: { id: string }[];
}

export interface AttemptShuffle {
  questionOrder: string[];
  optionOrder: Record<string, string[]>;
}

/** Per-attempt Fisher-Yates shuffle of question order and, within each question, option order. */
export function shuffleAttempt(questions: QuestionWithOptions[]): AttemptShuffle {
  const questionOrder = questions.map((q) => q.id);
  fisherYates(questionOrder);

  const optionOrder: Record<string, string[]> = {};
  for (const question of questions) {
    const optionIds = question.options.map((o) => o.id);
    fisherYates(optionIds);
    optionOrder[question.id] = optionIds;
  }

  return { questionOrder, optionOrder };
}

export interface ScoringQuestion {
  id: string;
  marks: number;
  negativeMarks: number;
  correctOptionId: string | null;
}

export interface ScoringAnswer {
  questionId: string;
  selectedOptionId: string | null;
}

export interface ScoringResult {
  totalScore: number;
  accuracyPct: number;
  attempted: number;
  correct: number;
  incorrect: number;
}

export function scoreAttempt(
  questions: ScoringQuestion[],
  answers: ScoringAnswer[]
): ScoringResult {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

  let totalScore = 0;
  let attempted = 0;
  let correct = 0;
  let incorrect = 0;

  for (const question of questions) {
    const answer = answerByQuestion.get(question.id);
    if (!answer?.selectedOptionId) continue;

    attempted++;
    if (answer.selectedOptionId === question.correctOptionId) {
      totalScore += question.marks;
      correct++;
    } else {
      totalScore -= question.negativeMarks;
      incorrect++;
    }
  }

  return {
    totalScore,
    accuracyPct: attempted ? (correct / attempted) * 100 : 0,
    attempted,
    correct,
    incorrect,
  };
}

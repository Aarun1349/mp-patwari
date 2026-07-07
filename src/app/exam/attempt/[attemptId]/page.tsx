import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ExamRoom } from "./ExamRoom";

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const { userId } = await verifySession();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { paper: true },
  });

  if (!attempt || attempt.userId !== userId) notFound();

  if (["submitted", "expired", "locked"].includes(attempt.status)) {
    redirect(`/exam/result/${attemptId}`);
  }

  const totalQuestions = (attempt.questionOrder as string[]).length;
  const remainingSeconds = Math.max(0, Math.floor((attempt.endsAt.getTime() - Date.now()) / 1000));

  return (
    <ExamRoom
      attemptId={attempt.id}
      paperTitle={attempt.paper.title}
      totalQuestions={totalQuestions}
      initialRemainingSeconds={remainingSeconds}
    />
  );
}

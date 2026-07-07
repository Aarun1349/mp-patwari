import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { StartButton } from "./StartButton";

export default async function ExamInstructionsPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  await verifySession();

  const paper = await prisma.paper.findUnique({ where: { id: paperId } });
  if (!paper || !paper.isActive) notFound();

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>{paper.title}</h1>
        <p className="muted">Read the instructions carefully before starting.</p>

        <section className="dashboard-section">
          <ul>
            <li>Total questions: {paper.totalQuestions}</li>
            <li>Total marks: {paper.totalMarks}</li>
            <li>Duration: {paper.durationMinutes} minutes</li>
            <li>Negative marking ratio: {paper.negativeMarkingRatio}</li>
          </ul>
        </section>

        <section className="dashboard-section">
          <h2>Exam rules</h2>
          <ul>
            <li>The exam runs in fullscreen mode. Exiting fullscreen 3 times locks your attempt.</li>
            <li>Right-click, text selection, and copy/paste are disabled during the exam.</li>
            <li>The timer is server-controlled and cannot be paused by closing the tab.</li>
            <li>On mobile browsers that don&apos;t support fullscreen, the exam still proceeds, but tab-switch violations still count.</li>
            <li>
              By starting this test you agree to our{" "}
              <Link href="/disclaimer">Disclaimer &amp; Policies</Link>.
            </li>
          </ul>
        </section>

        <StartButton paperId={paper.id} />
      </div>
    </main>
  );
}

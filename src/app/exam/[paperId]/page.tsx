import { notFound } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { StartButton } from "./StartButton";
import { DisclaimerModal } from "./DisclaimerModal";

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
    <main style={{ minHeight: "100vh", background: "#ffffff" }}>
      <div
        style={{
          background: "#1a2a44",
          borderBottom: "3px solid #c9a227",
          padding: "14px 28px",
        }}
      >
        <h1 style={{ fontSize: "16px", color: "#f0e9d8", fontWeight: 700, margin: 0 }}>{paper.title}</h1>
      </div>

      <div style={{ padding: "32px 28px", maxWidth: "860px", margin: "0 auto" }}>
        <p style={{ color: "#5c5c5c", marginBottom: "24px" }}>Read the instructions carefully before starting.</p>

        <section style={{ marginBottom: "28px" }}>
          <ul style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", color: "#1a2a44", listStyle: "none" }}>
            <li>Total questions: {paper.totalQuestions}</li>
            <li>Total marks: {paper.totalMarks}</li>
            <li>Duration: {paper.durationMinutes} minutes</li>
            <li>Negative marking ratio: {paper.negativeMarkingRatio}</li>
          </ul>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "18px", color: "#1a2a44", marginBottom: "12px" }}>Exam rules</h2>
          <ul style={{ display: "flex", flexDirection: "column", gap: "8px", color: "#2b2b2b", paddingLeft: "20px" }}>
            <li>The exam runs in fullscreen mode. Exiting fullscreen 3 times locks your attempt.</li>
            <li>Right-click, text selection, and copy/paste are disabled during the exam.</li>
            <li>The timer is server-controlled and cannot be paused by closing the tab.</li>
            <li>On mobile browsers that don&apos;t support fullscreen, the exam still proceeds, but tab-switch violations still count.</li>
            <li>
              By starting this test you agree to our <DisclaimerModal />.
            </li>
          </ul>
        </section>

        <StartButton paperId={paper.id} />
      </div>
    </main>
  );
}

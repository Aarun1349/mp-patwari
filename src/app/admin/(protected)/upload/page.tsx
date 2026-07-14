import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth/adminSession";
import { UploadForm } from "./UploadForm";

export default async function AdminUploadPage() {
  await verifyAdminSession();

  const [exams, papers] = await Promise.all([
    prisma.exam.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.paper.findMany({
      orderBy: { sequenceNo: "asc" },
      select: { id: true, title: true, isFree: true, examId: true },
    }),
  ]);

  return (
    <div className="auth-card" style={{ maxWidth: "600px" }}>
      <h1>Upload Questions</h1>
      <p className="page-subtitle">
        Pick the exam, download the sample sheet to get the exact format, fill it, then upload. Invalid rows are
        reported back — valid rows still import.
      </p>
      <UploadForm exams={exams} papers={papers} />
    </div>
  );
}

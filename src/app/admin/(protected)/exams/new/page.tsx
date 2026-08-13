import { requirePagePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { createExamAction } from "@/app/actions/adminExams";
import { ExamForm } from "../ExamForm";

export default async function NewExamPage() {
  await requirePagePermission(PERMISSIONS.EXAM_MANAGE);
  return (
    <div className="auth-card" style={{ maxWidth: "600px" }}>
      <a href="/admin/exams" style={{ fontSize: "13px", display: "inline-block", marginBottom: "10px" }}>
        ← Back to exams
      </a>
      <h1>Create Exam</h1>
      <p className="page-subtitle">Add a new state exam. You&apos;ll add its sections next, then papers and packages.</p>
      <ExamForm action={createExamAction} />
    </div>
  );
}

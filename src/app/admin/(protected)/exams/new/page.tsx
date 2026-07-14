import { verifyAdminSession } from "@/lib/auth/adminSession";
import { createExamAction } from "@/app/actions/adminExams";
import { ExamForm } from "../ExamForm";

export default async function NewExamPage() {
  await verifyAdminSession();
  return (
    <div className="auth-card" style={{ maxWidth: "520px" }}>
      <h1>Create Exam</h1>
      <p className="page-subtitle">Add a new state exam. You&apos;ll add its sections next, then papers and packages.</p>
      <ExamForm action={createExamAction} />
    </div>
  );
}

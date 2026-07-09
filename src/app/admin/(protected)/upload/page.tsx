import { prisma } from "@/lib/prisma";
import { UploadForm } from "./UploadForm";

export default async function AdminUploadPage() {
  const papers = await prisma.paper.findMany({
    orderBy: { sequenceNo: "asc" },
    select: { id: true, title: true, isFree: true },
  });

  return (
    <div className="auth-card" style={{ maxWidth: "560px" }}>
      <h1>Upload Questions</h1>
      <p className="muted">Internal content tool — no UI polish, functional only.</p>
      <UploadForm papers={papers} />
    </div>
  );
}

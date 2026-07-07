import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { assertUploadAllowed, ForbiddenError } from "@/lib/auth/uploadGate";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "./UploadForm";

export default async function UploadPage() {
  const { user } = await verifySession();

  try {
    assertUploadAllowed(user.phone);
  } catch (err) {
    if (err instanceof ForbiddenError) redirect("/dashboard");
    throw err;
  }

  const papers = await prisma.paper.findMany({
    orderBy: { sequenceNo: "asc" },
    select: { id: true, title: true, isFree: true },
  });

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ maxWidth: "560px" }}>
        <h1>Upload Questions</h1>
        <p className="muted">Internal content tool — no UI polish, functional only.</p>
        <UploadForm papers={papers} />
      </div>
    </main>
  );
}

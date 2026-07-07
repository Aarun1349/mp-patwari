import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const { user } = await verifySession();

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Your Profile</h1>
        <p className="muted">Mobile: {user.phone ?? "Not linked"}</p>
        <ProfileForm name={user.name ?? ""} email={user.email ?? ""} />
        <Link href="/dashboard" className="auth-secondary-link">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

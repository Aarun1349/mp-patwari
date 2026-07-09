import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/app/AppShell";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const { user } = await verifySession();

  return (
    <AppShell userLabel={user.phone ?? user.email ?? ""}>
      <div className="auth-card">
        <h1>Your Profile</h1>
        <p className="muted">Mobile: {user.phone ?? "Not linked"}</p>
        <ProfileForm name={user.name ?? ""} email={user.email ?? ""} />
      </div>
    </AppShell>
  );
}

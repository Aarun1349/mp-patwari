import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/app/AppShell";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const { user } = await verifySession();

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="auth-card">
        <h1>Your Profile</h1>
        <p className="muted">Mobile: {user.phone ?? "Not linked"}</p>
        <ProfileForm
          name={user.name ?? ""}
          email={user.email ?? ""}
          dateOfBirth={user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : ""}
          city={user.city ?? ""}
          category={user.category ?? ""}
          qualification={user.qualification ?? ""}
          examInterest={user.examInterest ?? ""}
          contactPhone={user.contactPhone ?? ""}
        />
      </div>
    </AppShell>
  );
}

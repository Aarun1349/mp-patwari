import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/app/AppShell";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const { userId, user } = await verifySession();

  const [credit, attemptCount] = await Promise.all([
    prisma.userCredit.findUnique({ where: { userId } }),
    prisma.attempt.count({ where: { userId } }),
  ]);

  return (
    <AppShell userLabel={user.name ?? user.phone ?? user.email ?? ""}>
      <div className="auth-card auth-card-wide">
        <h1>Your Profile</h1>

        <div className="profile-grid">
          <div>
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

          <div className="stat-tile-row">
            <div className="stat-tile">
              <div className="stat-label">Member Since</div>
              <div className="stat-value" style={{ fontSize: "16px" }}>
                {user.createdAt.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Tests Remaining</div>
              <div className="stat-value">{credit?.testsRemaining ?? 0}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Total Attempts</div>
              <div className="stat-value">{attemptCount}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Tests Purchased (lifetime)</div>
              <div className="stat-value">{credit?.testsTotalPurchased ?? 0}</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

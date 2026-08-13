import "server-only";

export interface TeacherWelcomeParams {
  to: string;
  teacherName: string | null;
  loginEmail: string;
  tempPassword: string;
  loginUrl: string;
  storefrontUrl: string;
}

/**
 * Emails a newly onboarded teacher their admin sign-in link + temporary
 * password. Sent from createTenantAction when a login email is provided.
 *
 * Uses Resend, with the same graceful-degradation pattern as sendReceiptEmail:
 * if RESEND_API_KEY / RESEND_FROM_EMAIL aren't configured, it logs to the
 * console instead of throwing, so onboarding still works before email is wired
 * up (the admin also sees the password in the form to share it manually).
 */
export async function sendTeacherWelcomeEmail(params: TeacherWelcomeParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.log(
      `[dev-teacher-welcome] ${params.to} — sign in at ${params.loginUrl} as ${params.loginEmail} / ${params.tempPassword}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: params.to,
      subject: "Welcome to ExamsExpress — your teacher login",
      html: `
        <p>Hi ${params.teacherName ?? "there"},</p>
        <p>Your ExamsExpress teacher account is ready — you can sign in and start
        adding your own mock tests and packages.</p>
        <ul>
          <li>Sign-in page: <a href="${params.loginUrl}">${params.loginUrl}</a></li>
          <li>Email: <strong>${params.loginEmail}</strong></li>
          <li>Temporary password: <strong>${params.tempPassword}</strong></li>
        </ul>
        <p>Please keep this password safe — you'll use it to sign in.</p>
        <p>Your public storefront: <a href="${params.storefrontUrl}">${params.storefrontUrl}</a></p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Not authorized to upload content.");
    this.name = "ForbiddenError";
  }
}

/**
 * Phone-allowlist gate for the question-upload tool — solo-founder/teacher
 * content tooling, not a public feature, so no new role/permission system.
 */
export function assertUploadAllowed(phone: string | null | undefined): void {
  const allowed = (process.env.ALLOWED_UPLOAD_PHONES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!phone || !allowed.includes(phone)) throw new ForbiddenError();
}

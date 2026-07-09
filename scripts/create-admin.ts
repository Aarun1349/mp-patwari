// One-off script: creates or updates an admin account.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npx tsx scripts/create-admin.ts
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.");
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD should be at least 10 characters.");
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  console.log(`Admin ready: ${admin.email} (${admin.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

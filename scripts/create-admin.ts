// One-off script: creates or updates an admin account.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npx tsx scripts/create-admin.ts
//
// Uses its own PrismaClient and scrypt hashing (matching src/lib/auth/password.ts's
// format exactly) instead of importing src/lib/prisma.ts / src/lib/auth/password.ts —
// both are guarded by `import "server-only"`, which throws when loaded outside
// Next's server-component graph (e.g. via plain tsx/node).
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCb);
const KEY_LENGTH = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

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

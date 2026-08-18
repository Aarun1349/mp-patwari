import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/auth/session";
import { storefrontUrl } from "@/lib/tenant";
import TenantStorefront from "./TenantStorefront";

// Dynamic: depends on DB + route param, must not be evaluated at build time.
export const dynamic = "force-dynamic";

async function loadTenant(slug: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { slug, isActive: true, approved: true },
  });
  if (!tenant) return null;

  const [papers, packages] = await Promise.all([
    prisma.paper.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { sequenceNo: "asc" },
      select: { id: true, title: true, isFree: true, totalQuestions: true, durationMinutes: true, examId: true },
    }),
    prisma.package.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, testCount: true, pricePaise: true, validityDays: true },
    }),
  ]);
  return { tenant, papers, packages };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadTenant(slug);
  if (!data) return { title: "Teacher not found — ExamsExpress" };
  const { tenant } = data;
  const title = `${tenant.name} — Mock Tests on ExamsExpress`;
  const description =
    tenant.tagline ?? tenant.bio ?? `Practice mock tests by ${tenant.ownerName ?? tenant.name} on ExamsExpress.`;
  return {
    title,
    description,
    alternates: { canonical: storefrontUrl(tenant.slug) },
    openGraph: { title, description, url: storefrontUrl(tenant.slug), type: "website" },
  };
}

export default async function TenantStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadTenant(slug);
  if (!data) notFound();

  // Non-redirecting session check — the storefront is public, but logged-in
  // students get live Buy / Take actions instead of a login prompt.
  const session = await getApiSession();

  // Per-tenant credit (examId -> testsRemaining) so each mock card knows whether
  // this student can start it (free, or holds credit for its exam under this tenant).
  const creditByExam: Record<string, number> = {};
  if (session) {
    const credits = await prisma.userCredit.findMany({
      where: { userId: session.userId, tenantId: data.tenant.id },
      select: { examId: true, testsRemaining: true },
    });
    for (const c of credits) creditByExam[c.examId] = c.testsRemaining;
  }

  return (
    <TenantStorefront
      tenant={{
        name: data.tenant.name,
        ownerName: data.tenant.ownerName,
        tagline: data.tenant.tagline,
        bio: data.tenant.bio,
      }}
      papers={data.papers}
      packages={data.packages}
      isLoggedIn={Boolean(session)}
      creditByExam={creditByExam}
    />
  );
}

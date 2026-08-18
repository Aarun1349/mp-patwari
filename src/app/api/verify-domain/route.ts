import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_APEX } from "@/lib/tenant";

// Called server-to-server by Caddy's on-demand TLS `ask` before it issues a
// certificate for a hostname. We return 200 only for the apex/www and for real,
// active tenant storefront subdomains — so a random `<anything>.examsexpress.in`
// can't trick the server into minting certs. Caddy appends `?domain=<host>`.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const domain = new URL(req.url).searchParams.get("domain")?.trim().toLowerCase() ?? "";
  if (!domain) return new NextResponse("missing domain", { status: 400 });

  // The main site.
  if (domain === STOREFRONT_APEX || domain === `www.${STOREFRONT_APEX}`) {
    return new NextResponse("ok", { status: 200 });
  }

  // Only single-level `<slug>.examsexpress.in` is eligible.
  const suffix = `.${STOREFRONT_APEX}`;
  if (!domain.endsWith(suffix)) return new NextResponse("denied", { status: 403 });
  const slug = domain.slice(0, domain.length - suffix.length);
  if (!slug || slug.includes(".")) return new NextResponse("denied", { status: 403 });

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { isActive: true },
  });
  if (tenant?.isActive) return new NextResponse("ok", { status: 200 });

  return new NextResponse("denied", { status: 403 });
}

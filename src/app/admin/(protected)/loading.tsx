import { LoadingScreen } from "@/components/ui/Spinner";

/**
 * Route-level loading UI for the admin section. Next.js shows this (via Suspense)
 * while a page's server component fetches its data — so navigating between admin
 * screens shows a themed spinner instead of a blank/janky pause.
 */
export default function AdminLoading() {
  return <LoadingScreen message="Loading…" />;
}

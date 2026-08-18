import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Fallback when nothing else is known. Every paper also carries its own
 *  sourceLang; this is only the app-wide default. */
export const DEFAULT_LANG = "en";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string | null;
}

/** The languages a student can pick, ordered. Cached per request. Adding a
 *  language = inserting a Language row (no code change). */
export const getActiveLanguages = cache(async (): Promise<LanguageOption[]> => {
  return prisma.language.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { code: true, name: true, nativeName: true },
  });
});

/** Whether a given language code is currently active (for validating a picker). */
export async function isActiveLanguage(code: string): Promise<boolean> {
  const langs = await getActiveLanguages();
  return langs.some((l) => l.code === code);
}

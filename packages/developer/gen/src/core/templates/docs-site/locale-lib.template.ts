/**
 * Stackra file contract:
 * Purpose: `LOCALE_LIB_TEMPLATE`, the `app/lib/locale.ts` of a generated multi-language Fumadocs site: the locale of a
 *          path (by its first segment), and the path of the same page in another locale (its home when the page has
 *          no translation).
 * Boundary: a constant; the emitted file reads only `app/site.json`. Emitted only when the DocsConfig sets `locales`.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (Fumadocs docs sites); brand family/i18n/ar-voice.md §7 (RTL).
 */

/** The emitted `app/lib/locale.ts`. */
export const LOCALE_LIB_TEMPLATE = `import site from "../site.json";

/** One language of the site, as gen wrote it into site.json. */
export interface SiteLocale {
  readonly code: string;
  readonly label: string;
  readonly dir: "ltr" | "rtl";
  readonly prefix: string;
  readonly font: { readonly family: string; readonly href: string } | null;
}

const locales = site.locales as readonly SiteLocale[];
const fallback = locales.find((locale) => locale.prefix === "") ?? (locales[0] as SiteLocale);

/** Every locale, default first as written. */
export const LOCALES = locales;

/** The locale of \`pathname\`: the one whose prefix is its first segment, else the default. */
export function localeOf(pathname: string): SiteLocale {
  const first = pathname.split("/")[1] ?? "";
  return locales.find((locale) => locale.prefix !== "" && locale.prefix === first) ?? fallback;
}

/** The path of the page at \`pathname\` in locale \`code\`; that locale's home when the page is not translated. */
export function switchLocale(pathname: string, code: string): string {
  const current = localeOf(pathname);
  const target = locales.find((locale) => locale.code === code) ?? fallback;
  const rest = current.prefix === "" ? pathname : pathname.slice(current.prefix.length + 1) || "/";
  const path = target.prefix === "" ? rest : "/" + target.prefix + (rest === "/" ? "" : rest);
  if ((site.paths as readonly string[]).includes(path)) return path;
  return target.prefix === "" ? "/" : "/" + target.prefix;
}
`;

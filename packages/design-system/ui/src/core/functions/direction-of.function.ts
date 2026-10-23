/**
 * Stackra file contract:
 * Purpose: the text direction of a locale, so a provider derives `dir` from the locale it is given.
 * Boundary: pure; reads Intl only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left).
 */
import type { Direction } from "#contracts/enums/direction.enum";

/** Scripts written right to left, for runtimes whose Intl.Locale has no text info (Firefox, older Hermes). */
const RTL_SCRIPTS = new Set([
  "Adlm",
  "Arab",
  "Hebr",
  "Mand",
  "Mend",
  "Nkoo",
  "Rohg",
  "Samr",
  "Syrc",
  "Thaa",
  "Yezi",
]);

/** The text info Intl.Locale reports: a method in newer engines, a getter in older ones; neither is typed yet. */
interface WithTextInfo {
  getTextInfo?: (() => { direction?: string }) | undefined;
  textInfo?: { direction?: string } | undefined;
}

/**
 * The text direction of a BCP 47 locale: `rtl` for Arabic, Hebrew, Persian, Urdu and the other right-to-left
 * scripts, `ltr` otherwise. An invalid locale is `ltr`.
 * @param locale - a BCP 47 tag, for example `ar-EG`
 * @returns the direction its script is written in
 */
export function directionOf(locale: string): Direction {
  let parsed: Intl.Locale;
  try {
    parsed = new Intl.Locale(locale);
  } catch {
    return "ltr";
  }
  const info = parsed as Intl.Locale & WithTextInfo;
  const direction = info.getTextInfo?.().direction ?? info.textInfo?.direction;
  if (direction) return direction === "rtl" ? "rtl" : "ltr";
  const script = parsed.maximize().script;
  return script !== undefined && RTL_SCRIPTS.has(script) ? "rtl" : "ltr";
}

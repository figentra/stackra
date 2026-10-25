/**
 * Stackra file contract:
 * Purpose: the text direction of a locale, so a provider derives `dir` from the locale it is given.
 * Boundary: pure; reads Intl, or the tag's own subtags where the runtime has no Intl.Locale (Hermes).
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

/** Languages whose default script is written right to left, for runtimes with no Intl.Locale at all (Hermes). */
const RTL_LANGUAGES = new Set([
  "ar",
  "ckb",
  "dv",
  "fa",
  "he",
  "iw",
  "ks",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
]);

/**
 * The direction from the tag's own subtags: its script when it names one (`az-Arab`), else its language. Hermes, the
 * React Native engine, has no Intl.Locale, and without this every locale there would read left to right.
 */
function directionOfTag(locale: string): Direction {
  const [language = "", ...rest] = locale.split(/[-_]/);
  const script = rest.find((subtag) => /^[a-z]{4}$/i.test(subtag));
  if (script !== undefined) {
    const titled = script.charAt(0).toUpperCase() + script.slice(1).toLowerCase();
    return RTL_SCRIPTS.has(titled) ? "rtl" : "ltr";
  }
  return RTL_LANGUAGES.has(language.toLowerCase()) ? "rtl" : "ltr";
}

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
  if (typeof Intl.Locale !== "function") return directionOfTag(locale);
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

/**
 * Stackra file contract:
 * Purpose: `textIn`, the string of a `LocalizedText` for a locale: the exact tag, else its language (`ar-EG` falls back
 *          to `ar`), else the first locale stored.
 * Boundary: pure; the same chain as `@stackra/model`'s `Translated#in`, so a block and a model field read alike. An
 *           empty map reads as `""`. Internal: not exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0162 (decision 2: the fallback chain); ADR 0305 (lang conventions: regional overlays fall
 *                     back to their base language).
 */
import type { LocalizedText } from "#core/types/localized-text.type";

/**
 * The text of `text` for `locale`.
 *
 * @example
 * textIn({ en: "Shirt", ar: "قميص" }, "ar-EG"); // "قميص"
 */
export function textIn(text: LocalizedText, locale: string): string {
  const language = locale.split("-")[0] ?? locale;
  return text[locale] ?? text[language] ?? Object.values(text)[0] ?? "";
}

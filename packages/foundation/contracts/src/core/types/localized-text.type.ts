/**
 * Stackra file contract:
 * Purpose: `LocalizedText`, the one per-locale text: one string per BCP 47 locale tag (`{ en: "Start today", ar:
 *          "ابدأ اليوم" }`). An experience block prop a scope's editor writes once per locale, and a brand kit's name and
 *          line, are this type.
 * Boundary: a type only. Which locale a reader shows is its own rule (experience's `textIn`: the exact tag, else its
 *           language, else the first stored); a consumer that requires a locale narrows it (brand-kit requires `en`).
 *           Gen compiles it as a record of strings; `@stackra/model`'s `Translated` is the stored column form.
 * Runtime: isomorphic
 * Governing contract: ADR 0114 (decision 2: pages are documents with i18n); ADR 0162 (decision 2: the per-locale
 *                     fallback chain); ADR 0441; ADR 0305 (lang conventions: BCP 47 case); STA-1383 (one home).
 */

/**
 * Text per locale.
 *
 * @example
 * const title: LocalizedText = { en: "Start today", ar: "ابدأ اليوم" };
 */
export type LocalizedText = Readonly<Record<string, string>>;

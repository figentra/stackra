/**
 * Stackra file contract:
 * Purpose: `LOCALES`: the locales the display settings offer, one left-to-right and one right-to-left, each named in
 *          its own language (endonyms are never translated).
 * Boundary: data only.
 * Runtime: browser
 * Governing contract: ADR 0060 (light, dark, RTL); ADR 0305 (rule 12: one declaration per file).
 */

/** The locales on offer. */
export const LOCALES = [
  { id: "en", short: "English", name: "English (LTR)", dir: "ltr" },
  { id: "ar", short: "العربية", name: "العربية (RTL)", dir: "rtl" },
] as const;

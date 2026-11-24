/**
 * Stackra file contract:
 * Purpose: `ShowcaseGap`, what a registry entry's web showcase can lack.
 * Boundary: a type; `findShowcaseMisses` produces it.
 * Runtime: node
 * Governing contract: STA-2738 (the `showcase:coverage` script), a child of STA-2705.
 */

/** What an entry lacks: `route`, `demo`, `en`, `ar` (the title label in that locale) or `test`. */
export type ShowcaseGap = "route" | "demo" | "en" | "ar" | "test";

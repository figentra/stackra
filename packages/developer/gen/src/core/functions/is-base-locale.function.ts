/**
 * Stackra file contract:
 * Purpose: `isBaseLocale`, whether a lang folder is a base language (`en`, `fil`) and not a regional overlay
 *          (`en-US`), so the i18n and intent checks agree on which catalogues must hold every key.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (the catalogue layout); STA-1306; STA-340.
 */

/**
 * Whether `locale` is a base-language folder, one without a region.
 *
 * @example
 * isBaseLocale("ar"); // true
 * isBaseLocale("ar-SA"); // false
 */
export function isBaseLocale(locale: string): boolean {
  return !locale.includes("-");
}

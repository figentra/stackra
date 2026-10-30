/**
 * Stackra file contract:
 * Purpose: `langSegment`, a slug or example id as an i18n key segment (kebab-case to snake_case).
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */

/** "icon-button" as the key segment "icon_button". */
export function langSegment(value: string): string {
  return value.replaceAll("-", "_");
}

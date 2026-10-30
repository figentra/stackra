/**
 * Stackra file contract:
 * Purpose: `localeForDirection(locale, direction)`, the locale React Aria is given so its arrow keys and placement
 *          follow a direction that contradicts the locale's own: `ar` read left to right is `ar-Latn`, `en` read right
 *          to left is `en-Arab`. Formatting keeps the language and region.
 * Boundary: pure. The same rule the web `DesignSystemProvider` applies to the whole app, for a local `Bidi` block.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060.
 */
import type { Direction } from "#contracts/enums/direction.enum";
import { directionOf } from "#core/functions/direction-of.function";

/**
 * The locale with a script of `direction`, or `locale` itself when it already reads that way.
 * @param locale - a BCP 47 tag
 * @param direction - the direction wanted
 * @returns a BCP 47 tag that reads in `direction`
 */
export function localeForDirection(locale: string, direction: Direction): string {
  if (directionOf(locale) === direction) return locale;
  try {
    return new Intl.Locale(locale, { script: direction === "rtl" ? "Arab" : "Latn" }).toString();
  } catch {
    return direction === "rtl" ? "ar" : "en";
  }
}

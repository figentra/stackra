/**
 * Stackra file contract:
 * Purpose: `MONTH_BUTTON_CLASS`, the class that flips the month chevrons of the web calendars in right-to-left.
 * Boundary: a class string only.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */

/**
 * The chevrons of the month buttons point the other way in a right-to-left page. HeroUI flips them, but its pickers
 * reset the flip inside their popover, so it is made again here (`!` because the reset is the more specific rule).
 */
export const MONTH_BUTTON_CLASS = "rtl:[&_svg]:rotate-180!";

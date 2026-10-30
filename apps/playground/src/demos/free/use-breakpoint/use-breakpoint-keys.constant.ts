/**
 * Stackra file contract:
 * Purpose: `USE_BREAKPOINT_KEYS`, the typed keys of the web useBreakpoint demos' words in
 *          `assets/lang/<locale>/use_breakpoint.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The use_breakpoint namespace's keys. */
export const USE_BREAKPOINT_KEYS = keys({
  use_breakpoint: {
    _: ["size_class", "breakpoint", "base", "resize", "filters", "close", "results", "products"],
    size: ["phone", "tablet", "desktop"],
    category: ["beverages", "bakery", "dairy", "snacks"],
    product: ["coffee", "croissant", "laban", "dates", "tea", "cheese", "juice", "maamoul"],
  },
});

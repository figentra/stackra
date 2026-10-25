/**
 * Stackra file contract:
 * Purpose: `LOYALTY_KIT_KEYS`, the typed i18n keys the renderers read from `assets/lang/<locale>/loyalty_kit.json`
 *          (`LOYALTY_KIT_KEYS.loyalty_kit.widgets.points_balance.title` is `"loyalty_kit::widgets.points_balance.title"`).
 * Boundary: internal; not exported from an entry. The stand-in for gen's `#stackra/i18n` `I18n` tree, built with the
 *           same `keys()` helper, so the renderers carry no raw key strings; delete it with STA-339.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); ADR 0231 (`<module>::<path>`); ADR 0322 (generated constants).
 */
import { keys } from "@stackra/i18n";

/** The renderers' keys under the `loyalty_kit` namespace. */
export const LOYALTY_KIT_KEYS = keys({
  loyalty_kit: {
    enums: { loyalty_tier: ["bronze", "silver", "gold"] },
    widgets: { points_balance: ["title", "expiry_note"], points_issued: ["title"] },
  },
});

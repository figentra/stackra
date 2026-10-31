/**
 * Stackra file contract:
 * Purpose: `TAMO_PROVIDER_KEYS`, the typed keys of the web tamo-provider demos' words in `assets/lang/<locale>/tamo_provider.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tamo_provider namespace's keys. */
export const TAMO_PROVIDER_KEYS = keys({
  tamo_provider: ["screen", "label", "text", "switch", "off"],
});

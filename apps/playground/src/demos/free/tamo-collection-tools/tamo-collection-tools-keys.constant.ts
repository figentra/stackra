/**
 * Stackra file contract:
 * Purpose: `TAMO_COLLECTION_TOOLS_KEYS`, the typed keys of the web tamo-collection-tools demos' words in `assets/lang/<locale>/tamo_collection_tools.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tamo_collection_tools namespace's keys. */
export const TAMO_COLLECTION_TOOLS_KEYS = keys({
  tamo_collection_tools: ["label", "screen", "hint", "filled"],
});

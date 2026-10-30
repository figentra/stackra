/**
 * Stackra file contract:
 * Purpose: `RULE_BUILDER_DEMO_KEYS`, the typed keys of the native rule-builder demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { keys } from "@stackra/i18n";

/** The rule-builder demos' keys. */
export const RULE_BUILDER_DEMO_KEYS = keys({
  demo_free: {
    rule_builder: {
      discount: ["label", "total", "city", "tag", "riyadh", "jeddah", "dammam"],
    },
  },
});

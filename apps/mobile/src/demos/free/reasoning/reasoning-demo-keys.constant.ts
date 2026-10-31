/**
 * Stackra file contract:
 * Purpose: `REASONING_DEMO_KEYS`, the typed keys of the native Reasoning demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const REASONING_DEMO_KEYS = keys({
  demo_free: {
    reasoning: { trace: ["summary", "search_label", "search", "compare_label", "compare", "check"], streaming: ["step"] },
  },
});

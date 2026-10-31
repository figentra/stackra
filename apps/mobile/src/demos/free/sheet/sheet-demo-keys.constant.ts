/**
 * Stackra file contract:
 * Purpose: `SHEET_DEMO_KEYS`, the typed keys of the native Sheet demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0305 (catalogue layout); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The sheet demos' keys. */
export const SHEET_DEMO_KEYS = keys({
  demo_free: {
    sheet: {
      basic: ["open", "heading", "body", "close", "apply"],
      snap: ["open", "heading", "body", "close"],
      backdrop: ["opaque", "blur", "transparent", "heading", "body", "close"],
    },
  },
});

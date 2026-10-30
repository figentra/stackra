/**
 * Stackra file contract:
 * Purpose: `LOADING_OVERLAY_KEYS`, the typed keys of the web Loading overlay demos' words in `assets/lang/<locale>/loading_overlay.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const LOADING_OVERLAY_KEYS = keys({
  loading_overlay: {
    saving: ["title", "body", "edit", "message", "toggle"],
    default: ["title", "body"],
    arabic: ["title", "body", "message"],
  },
});

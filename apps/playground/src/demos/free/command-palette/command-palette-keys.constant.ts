/**
 * Stackra file contract:
 * Purpose: `COMMAND_PALETTE_KEYS`, the typed keys of the web Command palette demos' words in `assets/lang/<locale>/command_palette.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The command_palette namespace's keys. */
export const COMMAND_PALETTE_KEYS = keys({
  command_palette: [
    "open",
    "go",
    "create",
    "orders",
    "customers",
    "reports",
    "product",
    "discount",
    "sales_words",
    "ran",
  ],
});

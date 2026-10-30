/**
 * Stackra file contract:
 * Purpose: `COMMAND_PALETTE_DEMO_KEYS`, the typed keys of the native command-palette demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { keys } from "@stackra/i18n";

/** The command-palette demos' keys. */
export const COMMAND_PALETTE_DEMO_KEYS = keys({
  demo_free: {
    command_palette: {
      launcher: [
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
    },
  },
});

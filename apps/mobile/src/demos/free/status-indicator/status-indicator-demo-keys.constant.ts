/**
 * Stackra file contract:
 * Purpose: `STATUS_INDICATOR_DEMO_KEYS`, the typed keys of the native status-indicator demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 30; ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The status-indicator demos' keys. */
export const STATUS_INDICATOR_DEMO_KEYS = keys({
  demo_free: {
    status_indicator: [
      "draft",
      "scheduled",
      "ready",
      "waiting",
      "late",
      "ticket",
      "minutes",
      "shawarma",
      "falafel",
      "latte",
      "kunafa",
      "table",
      "free",
      "seated",
      "bill",
      "cleaning",
      "overdue",
      "caption",
    ],
  },
});

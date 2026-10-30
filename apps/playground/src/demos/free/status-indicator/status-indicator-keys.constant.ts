/**
 * Stackra file contract:
 * Purpose: `STATUS_INDICATOR_KEYS`, the typed keys of the web status-indicator demos' words in `assets/lang/<locale>/status_indicator.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 30; ADR 0080 (typed i18n keys); ADR 0060 (light, dark, RTL).
 */
import { keys } from "@stackra/i18n";

/** The status_indicator namespace's keys. */
export const STATUS_INDICATOR_KEYS = keys({
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
});

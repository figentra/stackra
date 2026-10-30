/**
 * Stackra file contract:
 * Purpose: `ENTITY_PICKER_DEMO_KEYS`, the typed keys of the native entity-picker demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The entity-picker demos' keys. */
export const ENTITY_PICKER_DEMO_KEYS = keys({
  demo_free: {
    entity_picker: {
      shared: ["assignee", "placeholder", "loading", "empty", "failed", "refused"],
      several: ["label", "remove"],
      slow: ["label", "loading"],
      failing: ["label", "failure"],
      create: ["label", "create_label"],
      states: ["required", "invalid", "invalid_error", "disabled", "read_only"],
      live: ["label", "chosen", "none"],
    },
  },
});

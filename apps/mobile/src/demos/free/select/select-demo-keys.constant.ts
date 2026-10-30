/**
 * Stackra file contract:
 * Purpose: `SELECT_DEMO_KEYS`, the typed keys of the native select demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The select demos' keys. */
export const SELECT_DEMO_KEYS = keys({
  demo_free: {
    select: {
      basics: ["hint", "method", "method_placeholder", "status", "status_placeholder"],
      items: ["label", "placeholder"],
      live: ["chosen", "clear", "label", "none"],
      methods: ["courier", "pickup", "post"],
      plans: [
        "free",
        "free_note",
        "legacy",
        "legacy_note",
        "scale",
        "scale_note",
        "team",
        "team_note",
      ],
      presentation: ["full_width", "sheet"],
      sections: [
        "africa",
        "berlin",
        "cairo",
        "dubai",
        "europe",
        "label",
        "lagos",
        "middle_east",
        "paris",
        "placeholder",
        "riyadh",
      ],
      states: ["disabled", "invalid", "invalid_error", "read_only", "required", "with_value"],
      statuses: ["draft", "paid", "sent", "void"],
    },
  },
});

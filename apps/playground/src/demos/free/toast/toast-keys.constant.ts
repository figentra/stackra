/**
 * Stackra file contract:
 * Purpose: `TOAST_KEYS`, the typed keys of the web Toast demos' words in `assets/lang/<locale>/toast.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The toast namespace's keys. */
export const TOAST_KEYS = keys({
  toast: {
    _: [
      "show",
      "with_description",
      "with_action",
      "staying",
      "own_icon",
      "no_icon",
      "at_top",
      "stack",
      "clear",
      "dismiss_label",
      "look_label",
      "align_label",
    ],
    tone_messages: ["default", "accent", "success", "warning", "danger"],
    looks: ["alert", "bar", "flip_bar", "bubble"],
    aligns: ["start", "center", "end", "full"],
    promise: ["save", "fail", "loading", "success", "error"],
    undo: ["delete", "deleted", "undone", "committed", "waiting"],
    message: [
      "saved",
      "profile",
      "deleted",
      "undo",
      "restored",
      "paused",
      "copied",
      "saved_short",
      "syncing",
      "offline",
      "mention",
      "person",
    ],
  },
});

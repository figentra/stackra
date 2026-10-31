/**
 * Stackra file contract:
 * Purpose: `CHAT_SURFACE_KEYS`, the typed keys of the web chat-surface demo's words in `assets/lang/<locale>/chat_surface.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demo's keys. */
export const CHAT_SURFACE_KEYS = keys({
  chat_surface: {
    basics: [
      "log",
      "generated",
      "prompt",
      "placeholder",
      "disclaimer",
      "reasoning",
      "user",
      "assistant",
      "ask",
      "step_find",
      "step_track",
      "answer",
      "source",
      "reply",
      "track",
      "return",
    ],
  },
});

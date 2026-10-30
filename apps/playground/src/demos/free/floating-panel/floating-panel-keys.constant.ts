/**
 * Stackra file contract:
 * Purpose: `FLOATING_PANEL_KEYS`, the typed keys of the web FloatingPanel demos' words in
 *          `assets/lang/<locale>/floating_panel.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const FLOATING_PANEL_KEYS = keys({
  floating_panel: {
    basics: [
      "open",
      "title",
      "agent",
      "greeting",
      "customer",
      "question",
      "answer",
      "message",
      "send",
    ],
    tool_palette: ["open", "title", "selected", "price", "sale", "apply", "applied"],
  },
});

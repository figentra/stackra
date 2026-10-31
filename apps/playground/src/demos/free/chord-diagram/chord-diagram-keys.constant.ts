/**
 * Stackra file contract:
 * Purpose: `CHORD_DIAGRAM_KEYS`, the typed keys of the web Chord diagram demos' words in `assets/lang/<locale>/chord_diagram.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The chord_diagram namespace's keys. */
export const CHORD_DIAGRAM_KEYS = keys({
  chord_diagram: ["label", "basic", "standard", "premium", "cancelled"],
});

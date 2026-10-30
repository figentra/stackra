/**
 * Stackra file contract:
 * Purpose: `MODEL_PICKER_KEYS`, the typed keys of the web ModelPicker demos' words in
 *          `assets/lang/<locale>/model_picker.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const MODEL_PICKER_KEYS = keys({
  model_picker: {
    basics: [
      "swift",
      "deep",
      "vision",
      "atlas",
      "business",
      "fast",
      "reasoning",
      "vision_tag",
      "arabic",
      "picked",
    ],
    compact: ["label", "message", "placeholder", "send"],
  },
});

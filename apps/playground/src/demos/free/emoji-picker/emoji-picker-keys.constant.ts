/**
 * Stackra file contract:
 * Purpose: `EMOJI_PICKER_KEYS`, the typed keys of the web Emoji picker demos' words in `assets/lang/<locale>/emoji_picker.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const EMOJI_PICKER_KEYS = keys({ emoji_picker: { basics: ["label", "chosen", "none"] } });

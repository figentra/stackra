/**
 * Stackra file contract:
 * Purpose: `DITHER_ART_KEYS`, the typed keys of the web DitherArt demos' words in `assets/lang/<locale>/dither_art.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The dither_art namespace's keys. */
export const DITHER_ART_KEYS = keys({
  dither_art: { strata: ["caption"], core: ["caption"], glyphs: ["caption"] },
});

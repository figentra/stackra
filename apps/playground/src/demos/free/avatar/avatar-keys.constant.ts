/**
 * Stackra file contract:
 * Purpose: `AVATAR_KEYS`, the typed keys of the web Avatar demos' words in `assets/lang/<locale>/avatar.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The avatar namespace's keys. */
export const AVATAR_KEYS = keys({
  avatar: [
    "shape",
    "with_image",
    "variant",
    "loaded",
    "broken",
    "organisation",
    "anonymous",
    "accessible_name",
    "standalone",
    "row",
    "row_name",
    "row_role",
    "next_name",
    "image_on",
    "image_off",
    "current",
  ],
});

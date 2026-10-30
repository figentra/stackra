/**
 * Stackra file contract:
 * Purpose: `AVATAR_GROUP_KEYS`, the typed keys of the web AvatarGroup demos' words in `assets/lang/<locale>/avatar_group.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The avatar_group namespace's keys. */
export const AVATAR_GROUP_KEYS = keys({
  avatar_group: ["assignees", "branches", "on_shift", "shift_morning", "size"],
});

/**
 * Stackra file contract:
 * Purpose: `TAMO_DRAFT_REVIEW_KEYS`, the typed keys of the web tamo-draft-review demos' words in `assets/lang/<locale>/tamo_draft_review.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tamo_draft_review namespace's keys. */
export const TAMO_DRAFT_REVIEW_KEYS = keys({
  tamo_draft_review: [
    "before",
    "after",
    "accepted",
    "again",
    "working",
    "working_title",
    "error",
    "error_title",
  ],
});

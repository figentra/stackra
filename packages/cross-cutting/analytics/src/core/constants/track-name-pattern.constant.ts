/**
 * Stackra file contract:
 * Purpose: `TRACK_NAME_PATTERN`, what a `data-track` attribute value may be: 1 to 100 letters, digits, `.`, `_` or
 *          `-` (`checkout.pay_button`), so a click carries a name the author chose and never page text or user input.
 * Boundary: internal data; `ElementClicked`'s schema and the click listener both read it, so a bad value is skipped
 *           before it reaches `track()`.
 * Runtime: isomorphic
 * Governing contract: analytics gap 9 (stackra-409; no raw DOM text capture); ADR 0071 (privacy).
 */

/** A `data-track` name. */
export const TRACK_NAME_PATTERN = /^[\w.-]{1,100}$/;

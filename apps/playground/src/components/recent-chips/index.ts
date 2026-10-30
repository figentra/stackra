/**
 * Stackra file contract:
 * Purpose: public surface of the recent-chips component folder: the row and the two storage functions the shell and
 *          the palette share.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { RecentChips } from "./recent-chips";
export { readRecent } from "./read-recent.function";
export { rememberRecent } from "./remember-recent.function";

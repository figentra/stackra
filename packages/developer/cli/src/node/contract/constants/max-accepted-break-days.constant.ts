/**
 * Stackra file contract:
 * Purpose: `MAX_ACCEPTED_BREAK_DAYS`, the longest an accepted HTTP contract break may excuse a change after it is
 *          added: an accepted break is for the change that makes it, not a standing waiver.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4); STA-2837.
 */

/** The most days an accepted break's `expires` may fall after its `added`. */
export const MAX_ACCEPTED_BREAK_DAYS = 30;

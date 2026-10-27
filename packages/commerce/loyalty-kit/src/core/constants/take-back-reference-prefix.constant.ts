/**
 * Stackra file contract:
 * Purpose: the reference prefix of the entry that takes points back from a member (a refunded or cancelled purchase).
 * Boundary: a module-level constant (SCREAMING_SNAKE, ADR 0231); one declaration per file. Used by
 *           `AccountService.takeBack`, so a repeated take-back of one reference debits nothing twice and every driver
 *           sees the same convention.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 2); ADR 0231; STA-1323.
 */

/** A take-back entry's reference is this prefix plus the caller's reference (a refund id), one `adjust` entry each. */
export const TAKE_BACK_REFERENCE_PREFIX = "take_back:";

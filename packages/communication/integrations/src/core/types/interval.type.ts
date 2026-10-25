/**
 * Stackra file contract:
 * Purpose: `Interval`, a short length of time an Integration's options write: `"1s"`, `"200ms"`, `"6h"`.
 * Boundary: a type only; `intervalMs` reads it, and refuses a negative or malformed one when the Integration is
 *           declared. Units are milliseconds, seconds, minutes, hours and days of 24 hours.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13: rate limits and retries are declared on the Integration).
 */

/**
 * A whole or decimal number followed by its unit.
 *
 * @example
 * const per: Interval = "1s";
 */
export type Interval = `${number}${"ms" | "s" | "m" | "h" | "d"}`;

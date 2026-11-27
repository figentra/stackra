/**
 * Stackra file contract:
 * Purpose: `DEV_LOG_MAX_TEXT`, the longest `message` or `stack` a dev log entry keeps, in characters: 8000. A longer
 *          one is cut after redaction and ends with how many characters were cut, so a runaway line (a minified bundle
 *          in an error) cannot fill the log.
 * Boundary: a number only; `appendDevLog` applies it.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1); STA-2889.
 */

/** The longest message or stack an entry keeps, in characters. */
export const DEV_LOG_MAX_TEXT = 8000;

/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_STALE_PIN_DAYS`, how old a matrix pin may be before the summary flags it: past this many days
 *          since its `pinned` date (or with no date at all) the pin is stale and should move by a reviewed pull request.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813 (open question 6: reported, not enforced); STA-2705.
 */

/** Days after which a pin is stale. */
export const CONSUMER_GATE_STALE_PIN_DAYS = 14;

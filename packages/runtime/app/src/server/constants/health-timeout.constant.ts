/**
 * Stackra file contract:
 * Purpose: `HEALTH_TIMEOUT_MS`, how long `/readyz` waits for one health indicator before it counts it as down.
 * Boundary: a constant only; one slow dependency must not hold the whole probe past the orchestrator's own timeout.
 * Runtime: node
 * Governing contract: registry gap R-27 (owner decision 23); ADR 0295 (decision 8).
 */

/** Milliseconds one indicator may take. */
export const HEALTH_TIMEOUT_MS = 3000;

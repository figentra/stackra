/**
 * Stackra file contract:
 * Purpose: `PROBE_TIMEOUT_MS`, how long `/readyz` waits for one health indicator before it counts it as `down`.
 * Boundary: a constant; the same three seconds `@stackra/app`'s own readiness answer waits, so a deploy check sees one
 *           contract whichever route answers.
 * Runtime: node
 * Governing contract: ADR 0190 (health); registry gap R-27.
 */

/** Three seconds, in milliseconds. */
export const PROBE_TIMEOUT_MS = 3000;

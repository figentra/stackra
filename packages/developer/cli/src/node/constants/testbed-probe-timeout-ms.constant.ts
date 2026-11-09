/**
 * Stackra file contract:
 * Purpose: `TESTBED_PROBE_TIMEOUT_MS`, how long one health or slot probe of a box may take before the box counts as
 *          unhealthy for that look: the 15 s SSH connect, the Session Manager session and the agent's answer.
 * Boundary: a constant; the waiter looks again on its next poll, so a slow box is only skipped once.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0522 (the `testbed` CLI, ported from figentra/testbed#22).
 */

/** One box probe's deadline. */
export const TESTBED_PROBE_TIMEOUT_MS = 60_000;

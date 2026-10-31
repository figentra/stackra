/**
 * Stackra file contract:
 * Purpose: `DEFAULT_QUEUE`, the queue a job runs on when its action names none (`JOB_DEFAULTS.queue` of
 *          `@stackra/queue`); always listed in a service's `#stackra/queues`.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 3); STA-1723.
 */

/** The default queue's name. */
export const DEFAULT_QUEUE = "default";

/**
 * Stackra file contract:
 * Purpose: `Backoff`, the curve of a `RetryPolicy`: how the wait grows from `base` attempt after attempt. It is the
 *          `backoff` of an action's `job` option, of a workflow step's `retry` and of every other retrying package.
 * Boundary: an `Enum.of` value plus the type of the same name; `backoffDelay` turns a policy and an attempt number into
 *           a wait. The codes are stored on queued jobs and automation documents, so they never change. Moved here from
 *           @stackra/queue (stackra-223), which re-exports it for the template.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: retries with backoff and jitter); ADR 0294 (decisions 16 and 18); ADR 0305
 *                     (rule 28: the typed job surface).
 */
import { Enum } from "#core/bases/enum.base";

/**
 * The retry curves.
 *
 * @example
 * job: { queue: Queues.Delivery, retries: 5, backoff: Backoff.Exponential, deadLetter: true }
 */
export const Backoff = Enum.of({
  /** `base`, times `multiplier` (2) for each later attempt, up to `max`; the default. */
  Exponential: "exponential",
  /** Grows by `base` each attempt (`base`, `2 × base`, `3 × base`, …), up to `max`. */
  Linear: "linear",
  /** `base` between every attempt. */
  Fixed: "fixed",
});

/** One of the codes above. */
export type Backoff = Enum.Value<typeof Backoff>;

/**
 * Stackra file contract:
 * Purpose: `Backoff`, how long a failed attempt waits before the next one: the `backoff` of an action's `job` option and
 *          of a workflow step's `retry`.
 * Boundary: an `Enum.of` value plus the type of the same name; `backoffDelay` turns a code and an attempt number into a
 *           wait. Every code waits at least ten seconds and at most an hour, with jitter, so retries of many jobs that
 *           failed together spread out.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: retries with backoff and jitter); ADR 0294 (decisions 16 and 18); ADR 0305
 *                     (rule 28: the typed job surface).
 */
import { Enum } from "@stackra/contracts";

/**
 * The retry waits.
 *
 * @example
 * job: { queue: Queues.Delivery, retries: 5, backoff: Backoff.Exponential, deadLetter: true }
 */
export const Backoff = Enum.of({
  /** Doubles from ten seconds (10 s, 20 s, 40 s, …), up to an hour; the default. */
  Exponential: "exponential",
  /** Grows by ten seconds each attempt (10 s, 20 s, 30 s, …), up to an hour. */
  Linear: "linear",
  /** Ten seconds between every attempt. */
  Fixed: "fixed",
});

/** One of the codes above. */
export type Backoff = Enum.Value<typeof Backoff>;

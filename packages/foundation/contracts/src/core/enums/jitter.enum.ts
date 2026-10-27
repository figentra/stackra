/**
 * Stackra file contract:
 * Purpose: `Jitter`, how `backoffDelay` spreads a wait so retries that failed together do not return together.
 * Boundary: an `Enum.of` value plus the type of the same name; `random` (a number in `[0, 1)`) picks the point.
 *           `Equal` keeps the wait in the upper half, so it never collapses to zero (realtime and collaboration
 *           reconnects); `Added` adds up to half again, still capped at `max` (queue jobs, outbox, workflow steps).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: backoff with jitter); ADR 0225 (decision 1: reconnect).
 */
import { Enum } from "#core/bases/enum.base";

/**
 * The jitter of a retry wait.
 *
 * @example
 * const reconnect = { attempts: 10, base: Duration.seconds(1), max: Duration.seconds(30), jitter: Jitter.Equal };
 */
export const Jitter = Enum.of({
  /** The wait exactly; the default. */
  None: "none",
  /** Between half the wait and the wait. */
  Equal: "equal",
  /** The wait plus up to half of it, never past `max`. */
  Added: "added",
});

/** One of the codes above. */
export type Jitter = Enum.Value<typeof Jitter>;

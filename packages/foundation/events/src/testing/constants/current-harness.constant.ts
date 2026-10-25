/**
 * Stackra file contract:
 * Purpose: `CURRENT_HARNESS`, the event plumbing of the testing app compiled last, which the free helpers
 *          (`dispatch`, `drainEvents`, `drainOutbox`, `deliverRemoteEvent`, `toEmit`) act on.
 * Boundary: set by the events testing plugin on every `compile()`; read through `currentHarness()`. Internal: not
 *           exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { EventsHarness } from "#testing/types/events-harness.type";

/** The harness of the app compiled last; undefined before the first compile. */
export const CURRENT_HARNESS: { value: EventsHarness | undefined } = { value: undefined };

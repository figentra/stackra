/**
 * Stackra file contract:
 * Purpose: `SEQUENCE_TIME_ZONE_HOST`, the `SequenceTimeZone` driver `SequenceService` asks for the time zone of a yearly
 *          series, since the service is built by the container before the owner's driver is known to be bound.
 * Boundary: internal; written only by `connectSequenceTimeZone`. Unset, the call's own time zone governs. One driver
 *           per process, like the hold registry.
 * Runtime: node
 * Governing contract: ADR 0394 (decision 1); the `HOLD_HOST` precedent (ADR 0134 2026-10-24 amendment).
 */
import type { SequenceTimeZone } from "#contracts/ports/sequence-time-zone.port";

/** The connected driver, or undefined before `connectSequenceTimeZone`. */
export const SEQUENCE_TIME_ZONE_HOST: { source: SequenceTimeZone | undefined } = {
  source: undefined,
};

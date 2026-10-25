/**
 * Stackra file contract:
 * Purpose: the Clock port: the one source of "now" for code that records or compares times, so a test freezes time
 *          by binding a fake instead of patching `Date`.
 * Boundary: an abstract class that is its own token; the system driver ships with `@stackra/container`, a fake with
 *           the testing helpers. Inside an action, `ctx.now()` is the pipeline's reading of this clock.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0263 (ports resolve by type), ADR 0269 (time is faked in
 *                     tests).
 */
import { Port } from "#core/bases/port.base";

/** Tells the time. */
export abstract class Clock extends Port {
  /** The current instant, as a new `Date` the caller owns. */
  abstract now(): Date;
}

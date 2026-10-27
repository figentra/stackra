/**
 * Stackra file contract:
 * Purpose: `EventChangeBase<S>`, the instance side of an event change: `down`, and `up`, which reads an old payload
 *          as the event's current version.
 * Boundary: no options and no state; `Change<Event>({ from: 1, sunset })` (change.base.ts) is the kind base authors
 *           extend, and its event form's prototype is this class's. The entry exports it as a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 2, 5, 10 to 13 and 44); ADR 0118 (2026-10-23 note); ADR 0294 (decision 16).
 */
import type { Event } from "@stackra/events";

import { ChangeBase } from "#core/bases/change-base.base";

/**
 * The instance side of an event change: `down`, and `up`, which reads an old payload as the current version.
 *
 * @example
 * function upOf<S extends Event>(change: EventChangeBase<S>): S {
 *   return change.up(change);
 * }
 */
export abstract class EventChangeBase<S extends Event> extends ChangeBase<S> {
  /**
   * Lifts a value of this older shape to the subject's current version.
   *
   * @param old - the value in this class's shape.
   * @returns the current value, usually built with `Subject.create({ ... })`.
   */
  abstract up(old: this): S;
}

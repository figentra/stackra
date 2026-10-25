/**
 * Stackra file contract:
 * Purpose: `upgrade`, which reads an integration event payload of an older version as the event's current version:
 *          a stored row written before the version bump, or a delivery a producer still publishes at that version. It
 *          builds the payload with that version's change, then runs the change's `up`.
 * Boundary: event changes only: a dated change has no `up`, because responses only travel down and requests are never
 *           transformed. The payload is checked by the schema of the version it claims (a payload of the current
 *           version by the event's own). Each change converts straight to the current version, so no chain is walked.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note); ADR 0118 (2026-10-23 note); ADR 0305 (rule 5).
 */
import type { Event, EventClass } from "@stackra/events";
import type { Fields } from "@stackra/validation";

import type { EventChangeBase } from "#core/bases/change.base";
import { eventChangeOf } from "#core/functions/event-change-of.function";

/**
 * `payload`, written at `version`, as an event of the current version.
 *
 * @param subject - the integration event class.
 * @param payload - the payload as stored or received.
 * @param version - the version the payload was written at.
 * @returns a frozen event of the current version.
 * @throws TypeError when the subject's changes are dated.
 * @throws RangeError when `version` is not one of the subject's, or its change is not registered.
 * @throws ZodError when `payload` breaks the schema of its version.
 * @example
 * const earned = upgrade(PointsEarned, row.payload, row.version); // a v1 row read as v2
 */
export function upgrade<E extends Event>(
  subject: EventClass<E>,
  payload: unknown,
  version: number,
): E {
  const change = eventChangeOf(subject, version);
  if (change === undefined) return subject.create(payload as Fields<E>);
  const old = change.type.create(payload as object) as EventChangeBase<E>;
  return old.up(old);
}

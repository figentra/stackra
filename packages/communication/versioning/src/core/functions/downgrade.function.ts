/**
 * Stackra file contract:
 * Purpose: `downgrade`, the response and event transform: turns a value of a subject's current shape into the shape an
 *          older version expects with the `down` of the one change that serves that version. A dated version
 *          (`"2026-10-01"`) shapes a response for a caller pinned to it: the change with the earliest `from` after the
 *          pin. A whole version (`1`) shapes an integration event for a consumer still on it: the change from it.
 * Boundary: reads the registry only and never mutates `value`. Each change converts straight from the current shape,
 *           as its types say (`down(view: OrderView)`), so no chain is walked. A version no change serves (the newest,
 *           or the dormant case where only the latest version exists) returns `value` itself. Requests are never
 *           transformed. The generated adapter calls it at each place a response carries the subject.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decision 2 and the 2026-10-23 note); ADR 0141 (2026-10-23 note); ADR 0305 (rule 5).
 */
import type { AnyClass } from "@stackra/container";

import type { ChangeBase } from "#core/bases/change-base.base";
import { CHANGE_REGISTRY } from "#core/constants/change-registry.constant";
import { eventChangeOf } from "#core/functions/event-change-of.function";
import { isCalendarDate } from "#core/functions/is-calendar-date.function";
import type { RegisteredChange } from "#core/types/registered-change.type";

/** The dated change that serves a caller pinned to `version`, or `undefined` when none does. */
function datedChangeOf(subject: AnyClass, version: string): RegisteredChange | undefined {
  if (!isCalendarDate(version))
    throw new TypeError(`A dated version is a YYYY-MM-DD day, got ${JSON.stringify(version)}`);
  const changes = CHANGE_REGISTRY.get(subject) ?? [];
  if (changes.some((change) => typeof change.from === "number"))
    throw new TypeError(`${subject.name} has event changes, so it takes a whole version`);
  return changes.find((change) => (change.from as string) > version);
}

/**
 * `value` in the shape of `version`.
 *
 * @param subject - the class whose current shape `value` has.
 * @param value - the current value.
 * @param version - the caller's dated version, or the event version a consumer reads.
 * @returns the value in the older shape, or `value` itself when no change serves that version.
 * @throws TypeError when the form of `version` does not match the subject's changes, or a date is malformed.
 * @throws RangeError when a whole version is not one of the subject's, or its change is not registered.
 * @example
 * const body = downgrade(OrderView, view, resolved.version); // flat totalMinor for a 2026-10-01 caller
 * const v1 = downgrade(PointsEarned, event, 1);
 */
export function downgrade<S extends object>(
  subject: AnyClass<S>,
  value: S,
  version: number | string,
): object {
  const change =
    typeof version === "number" ? eventChangeOf(subject, version) : datedChangeOf(subject, version);
  if (change === undefined) return value;
  return (Object.create(change.type.prototype as object) as ChangeBase<S>).down(value);
}

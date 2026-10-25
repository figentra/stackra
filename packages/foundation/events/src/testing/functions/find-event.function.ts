/**
 * Stackra file contract:
 * Purpose: `findEvent`, the search behind `toRecord` and `toEmit`: the first event of a class whose fields include the
 *          expected ones.
 * Boundary: compares structurally (primitives, dates by time, arrays and plain objects); fields the expectation leaves
 *           out are not checked. Internal: not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { AnyClass } from "@stackra/container";

import type { Event } from "#core/index";

/** Structural equality: primitives, dates, arrays and plain objects. */
function same(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (typeof left !== "object" || typeof right !== "object" || left === null || right === null)
    return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left);
  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every((key) =>
      same((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
    )
  );
}

/**
 * The first event in `events` that is a `type` and holds every field of `fields`.
 *
 * @example
 * findEvent(published, PointsEarned, { points: 200 });
 */
export function findEvent<E extends Event>(
  events: readonly Event[],
  type: AnyClass<E>,
  fields: object = {},
): E | undefined {
  return events.find(
    (event): event is E =>
      event instanceof type &&
      Object.entries(fields).every(([key, value]) =>
        same((event as unknown as Record<string, unknown>)[key], value),
      ),
  );
}

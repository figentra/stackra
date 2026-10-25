/**
 * Stackra file contract:
 * Purpose: `queues(names)`, the queue enum of a member: gen writes `export const Queues = queues([...] as const)` into
 *          `#stackra/queues` from the `job` and `Listener({ queue })` options, and code names a queue as
 *          `Queues.Maintenance`.
 * Boundary: builds an `Enum.of` value, so the names are codes and travel as they are; the list is the one runway sizes.
 *           A name is snake_case and appears once.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 28: the job's queue is typed, `Queues.*`); ADR 0296 (runway queues); ADR 0231
 *                     (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

import type { QueueNames } from "#core/types/queue-names.type";

/** A snake_case queue name. */
const QUEUE_NAME = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/**
 * The queue enum of `names`.
 *
 * @throws TypeError when a name is not snake_case.
 * @throws RangeError when a name appears twice.
 * @example
 * export const Queues = queues(["default", "maintenance"] as const);
 * Queues.Maintenance; // "maintenance"
 */
export function queues<const N extends readonly string[]>(names: N): QueueNames<N> {
  const definition: Record<string, string> = {};
  for (const name of names) {
    if (typeof name !== "string" || !QUEUE_NAME.test(name))
      throw new TypeError(
        `A queue name is snake_case, such as "bulk_import", got ${JSON.stringify(name)}`,
      );
    const caseName = name
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    if (Object.hasOwn(definition, caseName))
      throw new RangeError(`Queue "${name}" is listed twice`);
    definition[caseName] = name;
  }
  return Enum.of(definition) as unknown as QueueNames<N>;
}

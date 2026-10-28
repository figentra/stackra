/**
 * Stackra file contract:
 * Purpose: `registerChanges`, which links each subject class to its change classes, so `downgrade`, `upgrade` and
 *          `resolveVersion` find them. Gen emits one call per member with its `[Subject, Change]` pairs, read from the
 *          type arguments of the `*.change.ts` files.
 * Boundary: writes the registry only, after checking each pair: the class extends `Change<Subject>({ ... })`; an event
 *           change's subject is an integration event at a version above `from` (domain events are never versioned); a
 *           dated change's subject is a schema; a subject takes one change per `from`. Registering a class again
 *           changes nothing (a reloaded dev module). Authored code never calls it outside a test.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (2026-10-23 note); ADR 0141 (2026-10-23 note); ADR 0305 (rule 5).
 */
import { type AnyClass, kindOf } from "@stackra/container";

import { CHANGE_REGISTRY } from "#core/constants/change-registry.constant";
import type { ChangeClass } from "#core/types/change-class.type";
import type { ChangeOptions } from "#core/types/change-options.type";

/**
 * Records each subject's changes, oldest `from` first.
 *
 * @param pairs - `[Subject, Change]` pairs, as a generated file lists them.
 * @throws TypeError when a class is not a change, its subject is of the wrong kind, or two changes of one subject
 *         share a `from`.
 * @throws RangeError when an event change holds a version its subject has not passed.
 * @example
 * registerChanges([
 *   [OrderView, OrderView202703Change],
 *   [PointsEarned, PointsEarnedV1Change],
 * ]);
 */
export function registerChanges(pairs: readonly (readonly [AnyClass, ChangeClass])[]): void {
  for (const [subject, type] of pairs) {
    const record = kindOf(type);
    if (record?.kind !== "change")
      throw new TypeError(`${type.name} does not extend Change<Subject>({ from, sunset })`);
    const { from, sunset } = record.options as unknown as ChangeOptions;
    const subjectRecord = kindOf(subject);
    if (typeof from === "number") {
      if (subjectRecord?.kind !== "integration_event")
        throw new TypeError(
          `${type.name} is an event change, so its subject must be an integration event; ${subject.name} is not`,
        );
      const version = subjectRecord.options["version"] as number;
      if (from >= version)
        throw new RangeError(
          `${type.name} holds version ${from}, but ${subject.name} is at version ${version}`,
        );
    } else if (subjectRecord?.kind !== "schema")
      throw new TypeError(
        `${type.name} is a dated change, so its subject must be a schema; ${subject.name} is not`,
      );

    const changes = CHANGE_REGISTRY.get(subject) ?? [];
    if (changes.some((registered) => registered.type === type)) continue;
    const clash = changes.find((registered) => registered.from === from);
    if (clash !== undefined)
      throw new TypeError(
        `${type.name} and ${clash.type.name} both change ${subject.name} from ${from}; keep one change per \`from\``,
      );
    CHANGE_REGISTRY.set(
      subject,
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      [...changes, { type, from, sunset }].sort((a, b) => (a.from < b.from ? -1 : 1)),
    );
  }
}

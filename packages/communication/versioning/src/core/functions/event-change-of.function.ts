/**
 * Stackra file contract:
 * Purpose: `eventChangeOf`, the registered change that converts between a version of an integration event and its
 *          current version, or `undefined` when the asked version is the current one: what `downgrade` and `upgrade`
 *          run for a whole version.
 * Boundary: internal: not exported from the entry. The current version is the one `IntegrationEvent({ version })`
 *           recorded. Each change converts straight from and to the current version, as its types say
 *           (`Change<PointsEarned>`), so one change serves one old version and no chain is walked. A version outside 1
 *           to current, a version with no change (its sunset passed and the file is gone) and a subject with dated
 *           changes are refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note); ADR 0118 (2026-10-23 note); ADR 0305 (rule 5).
 */
import { type AnyClass, kindOf } from "@stackra/container";

import { CHANGE_REGISTRY } from "#core/constants/change-registry.constant";
import type { RegisteredChange } from "#core/types/registered-change.type";

/**
 * The change of `version`, or `undefined` for the current version.
 *
 * @throws TypeError when the subject's changes are dated.
 * @throws RangeError when `version` is not a version of the subject, or no change of it is registered.
 * @example
 * eventChangeOf(PointsEarned, 1); // PointsEarnedV1Change's entry, PointsEarned being at version 2
 * eventChangeOf(PointsEarned, 2); // undefined
 */
export function eventChangeOf(subject: AnyClass, version: number): RegisteredChange | undefined {
  const changes = CHANGE_REGISTRY.get(subject) ?? [];
  if (changes.some((change) => typeof change.from !== "number"))
    throw new TypeError(`${subject.name} has dated changes, so it takes a YYYY-MM-DD version`);
  const current = (kindOf(subject)?.options["version"] as number | undefined) ?? 1;
  if (!Number.isInteger(version) || version < 1 || version > current)
    throw new RangeError(`${subject.name} has versions 1 to ${current}, got ${version}`);
  if (version === current) return undefined;
  const change = changes.find((registered) => registered.from === version);
  if (change === undefined)
    throw new RangeError(`${subject.name} has no registered change from version ${version}`);
  return change;
}

/**
 * Stackra file contract:
 * Purpose: `publishedVersions`, the older versions of an integration event that are still published beside its current
 *          one on a day: the `from` of each registered event change whose sunset has not come (ADR 0141: both versions
 *          are published until the change's sunset). The outbox relay publishes each with `downgrade`.
 * Boundary: reads the registry only. A subject with no changes, or only dated ones, has none. The sunset day is
 *           compared in UTC, and a change stops on its sunset day.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note); ADR 0118 (2026-10-23 note); ADR 0305 (rule 5).
 */
import type { AnyClass } from "@stackra/container";

import { CHANGE_REGISTRY } from "#core/constants/change-registry.constant";

/**
 * The older versions of `subject` still published on `on`, oldest first.
 *
 * @example
 * publishedVersions(PointsEarned, new Date("2027-01-10")); // [1] until PointsEarnedV1Change's sunset, 2027-04-01
 */
export function publishedVersions(subject: AnyClass, on: Date): readonly number[] {
  const day = on.toISOString().slice(0, 10);
  return (CHANGE_REGISTRY.get(subject) ?? []).flatMap((change) =>
    typeof change.from === "number" && change.sunset > day ? [change.from] : [],
  );
}

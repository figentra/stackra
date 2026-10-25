/**
 * Stackra file contract:
 * Purpose: `pointsEntry`, the `PointsEntry` fixture: builds port DTOs (values, not rows) for driver and matcher tests.
 * Boundary: a test fixture in `testing/`, built on the generic `factory` of @stackra/testing. The port's DTO is not a
 *           model, so this is no `Factory<Model>` kind and no `.factory.ts`: that suffix belongs to
 *           `database/factories/` alone. `at` is the clock at build time (the frozen test clock when one is set).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 2 and 15); ADR 0269 (helpers in the owning package).
 */
import { factory } from "@stackra/testing";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import type { PointsEntry } from "#contracts/types/points-entry.type";
import { memberId } from "#core/functions/member-id.function";

/**
 * A 100-point earn of `usr_1`; `pointsEntry.build({ points: -50 })` overrides any field, `pointsEntry.buildMany(3)`
 * numbers the references.
 *
 * @example
 * await ledger.append(pointsEntry.build({ memberId: member, points: 10_000, at }));
 */
export const pointsEntry = factory<PointsEntry>({
  memberId: memberId("usr_1"),
  points: 100,
  kind: EntryKind.Earn,
  reference: (i) => `ord_${i}`,
  at: () => new Date(),
});

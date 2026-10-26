/**
 * Stackra file contract:
 * Purpose: `PointsEarnedV1Change`, the version change of `loyalty_kit.points.earned`: v1 had no tier and no balance.
 *          `up` reads a stored v1 payload as v2; `down` gives a v1 consumer the shape it was built against.
 * Boundary: a change beside its event: the event it versions is the type argument (`Change<PointsEarned>`), the fields
 *           are the v1 shape. Both versions are published until the sunset; after it, gen fails while this file still
 *           exists, and deleting it stops v1. It registers its schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 1, 13 and 16); ADR 0305 (rules 2, 5 and 21); ADR 0141; ADR 0131 (sunset).
 */
import { Int, registerSchemas } from "@stackra/validation";
import { Change } from "@stackra/versioning";
import { z } from "zod";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { PointsEarned } from "#node/events/points-earned.event";

/**
 * A v1 row has no balance, so `balanceAfter` is the credit itself and the tier is bronze; listeners treat both as lower
 * bounds.
 *
 * @example
 * new PointsEarnedV1Change().up(v1Payload); // a PointsEarned at v2
 */
export class PointsEarnedV1Change extends Change<PointsEarned>({
  from: 1,
  sunset: "2027-04-01",
}) {
  /** Points credited to the member. */
  @Int()
  points!: number;

  /** The member credited. */
  memberId!: string;

  /** What caused the credit. */
  reference!: string;

  /** Lifts a v1 payload to v2 by filling the two fields v1 never carried. */
  up(v1: PointsEarnedV1Change): PointsEarned {
    return PointsEarned.create({
      memberId: v1.memberId,
      points: v1.points,
      reference: v1.reference,
      tier: LoyaltyTier.Bronze,
      balanceAfter: v1.points,
    });
  }

  /** Turns a v2 payload into v1, for consumers still on v1. */
  down(v2: PointsEarned): PointsEarnedV1Change {
    return PointsEarnedV1Change.create({
      memberId: v2.memberId,
      points: v2.points,
      reference: v2.reference,
    });
  }
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PointsEarnedV1Change,
    z.object({ memberId: z.string(), points: z.number().int(), reference: z.string() }),
  ],
]);

/**
 * Stackra file contract:
 * Purpose: `PointsEarned`, the fact that points were credited. Leaves through the host's outbox as
 *          `loyalty_kit.points.earned.v2`.
 * Boundary: an integration event at version 2: it added the tier and the balance after, so consumers need no second
 *           call. `points-earned-v1.change.ts` beside this file converts both ways, so v1 is published too until its
 *           sunset. Recorded by `AccountService#earn` after the ledger entry is written. It registers its schema when
 *           the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 5, 16 and 20); ADR 0141 (as amended: `version`); ADR 0305 (rules 19 and 21);
 *                     ADR 0131 (deprecation window).
 */
import { Enum } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/**
 * The balance is read in the same transaction as the credit.
 *
 * @example
 * account.record(PointsEarned.create({ memberId, points, reference, tier, balanceAfter }));
 */
export class PointsEarned extends IntegrationEvent({
  name: "points.earned",
  version: 2,
}) {
  /** Points credited to the member. */
  @Int()
  points!: number;

  /** The member's balance after the credit. */
  @Int()
  balanceAfter!: number;

  /** The member credited. */
  memberId!: string;

  /** What caused the credit (an order id). */
  reference!: string;

  /** The member's tier when the credit was made. */
  tier!: LoyaltyTier;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PointsEarned,
    z.object({
      memberId: z.string(),
      points: z.number().int(),
      reference: z.string(),
      tier: z.enum(Enum.values(LoyaltyTier)),
      balanceAfter: z.number().int(),
    }),
  ],
]);

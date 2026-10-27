/**
 * Stackra file contract:
 * Purpose: `PointsImported`, a balance carried over to one member from another platform. Leaves through the host's
 *          outbox as `loyalty_kit.points.imported.v1`; the balance and points-issued queries' caches are dropped by it.
 * Boundary: an integration event at version 1, recorded on the account by `AccountService.importBalance` only when the
 *           credit was written. Deliberately not `points.earned`: an imported balance is not an earn, so the tier
 *           listener does not run for it; the import's own tier is applied by the service. It registers its schema when
 *           the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 5, 16 and 20); ADR 0141 (names and envelope); ADR 0305 (rule 19); ADR 0078
 *                     (outbox); ADR 0454 (decision 4); STA-1323.
 */
import { Enum } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/**
 * One event per imported line.
 *
 * @example
 * account.record(PointsImported.create({ memberId, points, reference, tier: account.tier, balanceAfter }));
 */
export class PointsImported extends IntegrationEvent({ name: "points.imported" }) {
  /** Points credited, exactly as imported. */
  @Int({ min: 1 })
  points!: number;

  /** The member's balance after the credit. */
  @Int({ min: 0 })
  balanceAfter!: number;

  /** The member credited. */
  memberId!: string;

  /** The import line's reference, without the kit's prefix. */
  reference!: string;

  /** The account's tier after the import. */
  tier!: LoyaltyTier;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    PointsImported,
    z.object({
      memberId: z.string(),
      points: z.number().int().min(1),
      reference: z.string(),
      tier: z.enum(Enum.values(LoyaltyTier)),
      balanceAfter: z.number().int(),
    }),
  ],
]);

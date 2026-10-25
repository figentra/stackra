/**
 * Stackra file contract:
 * Purpose: `BalanceView`, the output of `loyalty_kit.points.balance@1`, also the data of the points-balance renderers.
 * Boundary: a shape class (an output view, so `<X>View`), shared by the query (node) and the renderers (react and
 *           native), so it lives in core; never the database row. `nextExpiryAt` is a `Date` in code and ISO 8601 with
 *           an offset on the wire. It registers its schema when the module loads, so `BalanceView.create` validates
 *           with no generated file (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 15 and 26); ADR 0328 (`create`).
 */
import { Enum } from "@stackra/contracts";
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/**
 * A balance snapshot with the date the oldest live points expire, so a client can warn the member.
 *
 * @example
 * return BalanceView.create({ memberId, tier, balance: 1_000, nextExpiryAt: null });
 */
export class BalanceView extends Schema {
  /** The member the balance belongs to. */
  memberId!: string;

  /** The account's tier. */
  tier!: LoyaltyTier;

  /** Whole points the member holds. */
  @Int({ min: 0 })
  balance!: number;

  /** When the oldest live earned points expire; null when nothing is earned. */
  nextExpiryAt!: Date | null;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    BalanceView,
    z.object({
      memberId: z.string(),
      tier: z.enum(Enum.values(LoyaltyTier)),
      balance: z.number().int().min(0),
      nextExpiryAt: z.date().nullable(),
    }),
  ],
]);

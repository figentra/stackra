/**
 * Stackra file contract:
 * Purpose: `EnrollMemberOutput`, the output of `loyalty_kit.account.enroll@1`: the account and its tier, whether it was
 *          just created or already existed.
 * Boundary: a shape class in its own file; built with `EnrollMemberOutput.create`, never `new`. It registers its schema
 *           when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0328.
 */
import { Enum } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/**
 * The account and its tier.
 *
 * @example
 * return EnrollMemberOutput.create({ accountId: account.id, tier: account.tier });
 */
export class EnrollMemberOutput extends Schema {
  /** The account's public id. */
  accountId!: PublicId<"lac">;

  /** The account's tier. */
  tier!: LoyaltyTier;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    EnrollMemberOutput,
    z.object({ accountId: publicId("lac"), tier: z.enum(Enum.values(LoyaltyTier)) }),
  ],
]);

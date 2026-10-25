/**
 * Stackra file contract:
 * Purpose: `EnrollMemberInput`, the input of `loyalty_kit.account.enroll@1`: the account address, the principal and the
 *          tier.
 * Boundary: a shape class in its own file. The account id is the PUT address the client mints, so a retried call
 *           addresses the same account; the principal travels in the body, never the path. It registers its schema
 *           when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0136 (the actor is
 *                     never an input field).
 */
import { Enum } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/**
 * Who to enroll, at which address and tier; staff may start a VIP at gold.
 *
 * @example
 * EnrollMemberInput.create({ accountId, principalId: "usr_1", tier: LoyaltyTier.Gold });
 */
export class EnrollMemberInput extends Schema {
  /** The account's public id, minted by the client; the path parameter of the endpoint. */
  accountId!: PublicId<"lac">;

  /** The principal public id to enroll. */
  @Str({ min: 1 })
  principalId!: string;

  /** The starting tier. */
  tier: LoyaltyTier = LoyaltyTier.Bronze;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    EnrollMemberInput,
    z.object({
      accountId: publicId("lac"),
      principalId: z.string().min(1),
      tier: z.enum(Enum.values(LoyaltyTier)).default(LoyaltyTier.Bronze),
    }),
  ],
]);

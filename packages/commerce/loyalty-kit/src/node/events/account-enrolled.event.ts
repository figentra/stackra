/**
 * Stackra file contract:
 * Purpose: `AccountEnrolled`, the fact that an account now exists for a principal. Leaves through the host's outbox as
 *          `loyalty_kit.account.enrolled.v1`.
 * Boundary: an integration event: typed fields, built only with `AccountEnrolled.create`, recorded once, by
 *           `AccountService#enroll`. Version 1 until a breaking change adds `version: 2` and a change file beside this
 *           one. It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 5, 16 and 20); ADR 0141 (names and envelope); ADR 0305 (rule 19); ADR 0078
 *                     (outbox).
 */
import { Enum } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { publicId, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/**
 * The account exists now; consumers react to it without asking the kit.
 *
 * @example
 * account.record(AccountEnrolled.create({ accountId, memberId, tier }));
 */
export class AccountEnrolled extends IntegrationEvent({ name: "account.enrolled" }) {
  /** The new account. */
  accountId!: PublicId<"lac">;

  /** The principal it belongs to. */
  memberId!: string;

  /** The tier it starts at. */
  tier!: LoyaltyTier;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AccountEnrolled,
    z.object({
      accountId: publicId("lac"),
      memberId: z.string(),
      tier: z.enum(Enum.values(LoyaltyTier)),
    }),
  ],
]);

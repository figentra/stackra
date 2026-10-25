/**
 * Stackra file contract:
 * Purpose: `LoyaltyAccountView`, one row of the account list, the public shape of a loyalty account.
 * Boundary: a shape class (an output view of the `LoyaltyAccount` model): the row of the standard list and get
 *           operations gen writes for the account resource. Never the database row, never the ledger entries. It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 15 and 26); ADR 0328 (`create`).
 */
import { Enum } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/**
 * An account as the console list and the operations return it.
 *
 * @example
 * LoyaltyAccountView.create({ accountId: account.id, memberId, tier, isFrozen, frozenAt, createdAt });
 */
export class LoyaltyAccountView extends Schema {
  /** The account's public id. */
  accountId!: PublicId<"lac">;

  /** The principal the account belongs to. */
  memberId!: string;

  /** The current tier. */
  tier!: LoyaltyTier;

  /** Whether the account is frozen for review. */
  isFrozen!: boolean;

  /** When the account was frozen; null while active. */
  frozenAt!: Date | null;

  /** When the account was created. */
  createdAt!: Date;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    LoyaltyAccountView,
    z.object({
      accountId: publicId("lac"),
      memberId: z.string(),
      tier: z.enum(Enum.values(LoyaltyTier)),
      isFrozen: z.boolean(),
      frozenAt: z.date().nullable(),
      createdAt: z.date(),
    }),
  ],
]);

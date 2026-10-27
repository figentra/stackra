/**
 * Stackra file contract:
 * Purpose: `PointsImport`, what a host hands `AccountService.importBalance` to carry a member's balance over from
 *          another platform: the exact points, the reference the credit is idempotent on, and the tier they held there.
 * Boundary: a type in the leaf entry; the member is a separate argument. No amount, currency or earn rate: an imported
 *           balance is points as they are, never re-earned, and no extension runs on it. The tier is the host's
 *           mapping of the source platform's tier, applied only to raise the account's tier.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); STA-1323 (Commerce customers loyalty SPEC, "Stackra gaps").
 */
import type { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/**
 * One imported balance to credit.
 *
 * @example
 * await accounts.importBalance(member, { points: 1_250, reference: `salla:${row.id}`, tier: LoyaltyTier.Silver });
 */
export interface PointsImport {
  /** The points to credit, exactly: a positive whole number. */
  readonly points: number;

  /** The import line the credit is for (a run and row id); a repeated reference credits nothing twice. */
  readonly reference: string;

  /** The tier the member held on the source platform; raises the account's tier, never lowers it. */
  readonly tier?: LoyaltyTier;
}

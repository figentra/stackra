/**
 * Stackra file contract:
 * Purpose: `LoyaltyCardPassSource`, what the loyalty card pass is built from: the account's public id, the programme
 *          name, the tier, the points balance and the brand kit's colours and logo.
 * Boundary: a type only. The host fills it from the `LoyaltyAccount`, the balance query and the scope's brand kit;
 *           the programme name and the brand are tenant data, never code. The member id is not on it (it is
 *           pseudonymous and a pass shows only what a lock screen may show, ADR 0348 decision 5).
 * Runtime: node
 * Governing contract: ADR 0348 (decision 5); ADR 0345 (decision 2); ADR 0454.
 */
import type { PassContent } from "@stackra/integrations";

import type { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

/** The values of one loyalty card pass. */
export interface LoyaltyCardPassSource {
  /** The account's public id (`lac_…`): the pass serial and the barcode scanned at the counter. */
  readonly accountId: string;

  /** The programme's name as the scope's brand shows it. */
  readonly programName: string;

  /** The member's tier. */
  readonly tier: LoyaltyTier;

  /** The spendable points balance. */
  readonly balance: number;

  /** The brand kit's colours and logo. */
  readonly brand?: Pick<PassContent, "colors" | "logo">;
}

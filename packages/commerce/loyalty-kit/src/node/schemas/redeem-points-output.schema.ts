/**
 * Stackra file contract:
 * Purpose: `RedeemPointsOutput`, the output of `loyalty_kit.points.redeem@1`: what was debited, what it is worth and the
 *          balance after.
 * Boundary: a shape class in its own file, returned by the action and built by the workflow's `output`; built with
 *           `RedeemPointsOutput.create`, never `new`. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * What the caller gets back.
 *
 * @example
 * return RedeemPointsOutput.create({ points: 300, amountMinor: 300, balance: 700 });
 */
export class RedeemPointsOutput extends Schema {
  /** Points debited from the member. */
  @Int({ min: 0 })
  points!: number;

  /** The discount those points bought, in minor units. */
  @Int({ min: 0 })
  amountMinor!: number;

  /** The member's balance after the debit. */
  @Int({ min: 0 })
  balance!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    RedeemPointsOutput,
    z.object({
      points: z.number().int().min(0),
      amountMinor: z.number().int().min(0),
      balance: z.number().int().min(0),
    }),
  ],
]);

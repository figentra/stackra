/**
 * Stackra file contract:
 * Purpose: `RedeemPointsInput`, the input of `loyalty_kit.points.redeem@1`: points to spend, the idempotent reference
 *          and the amount still to pay.
 * Boundary: a shape class in its own file, read by `RedeemPointsAction`, `RedeemPointsWorkflow` and the
 *           `redeemVerify` slot of the extension point. Built with `RedeemPointsInput.create`, never `new`. The actor
 *           is never a field. It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0136 (the actor is
 *                     never an input field).
 */
import { Int, registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

import { MAX_POINTS_PER_ENTRY } from "#core/constants/max-points-per-entry.constant";

/**
 * How many points to spend, the reference the debit is idempotent on, and the amount still to pay.
 *
 * @example
 * RedeemPointsInput.create({ points: 300, reference: "ord_2", totalMinor: 10_000 });
 */
export class RedeemPointsInput extends Schema {
  /** Whole points to spend; capped by balance and by the configured percentage. */
  @Int({ min: 1, max: MAX_POINTS_PER_ENTRY })
  points!: number;

  /** Public id of the thing paid for (`ord_…`); a repeated reference debits nothing twice. */
  @Str({ min: 1, max: 120 })
  reference!: string;

  /** The amount still to pay, in minor units, so the percentage cap can be applied. */
  @Int({ min: 0 })
  totalMinor!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    RedeemPointsInput,
    z.object({
      points: z.number().int().min(1).max(MAX_POINTS_PER_ENTRY),
      reference: z.string().min(1).max(120),
      totalMinor: z.number().int().min(0),
    }),
  ],
]);

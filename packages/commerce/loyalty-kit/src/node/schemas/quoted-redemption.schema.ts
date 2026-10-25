/**
 * Stackra file contract:
 * Purpose: `QuotedRedemption`, the stored result of the redeem workflow's `quote` step, which the later steps read.
 * Boundary: a shape class, because a step result is stored with the run; never an input or an output of an action. The
 *           member is taken from the actor (or the customer a service acts for), never from input. It registers its
 *           schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 18 and 26); ADR 0305 (one declaration per file).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * The member, the capped offer and the reference the debit is idempotent on.
 *
 * @example
 * return QuotedRedemption.create({ memberId: member, points: 300, amountMinor: 300, reference: "ord_2" });
 */
export class QuotedRedemption extends Schema {
  /** The member who redeems. */
  memberId!: string;

  /** Points that will be debited, capped by balance and percentage. */
  @Int({ min: 0 })
  points!: number;

  /** The discount those points buy, in minor units. */
  @Int({ min: 0 })
  amountMinor!: number;

  /** The caller's reference, the idempotency key of the debit. */
  reference!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    QuotedRedemption,
    z.object({
      memberId: z.string(),
      points: z.number().int().min(0),
      amountMinor: z.number().int().min(0),
      reference: z.string(),
    }),
  ],
]);

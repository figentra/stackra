/**
 * Stackra file contract:
 * Purpose: `ConfirmRedemptionInput`, the input of `loyalty_kit.points.confirm_redemption@1`: the reference of the
 *          redemption to confirm.
 * Boundary: a shape class in its own file; the member is the actor (or the customer a service acts for), never a
 *           field. It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0136 (the actor is
 *                     never an input field).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * The same reference the caller passed to `loyalty_kit.points.redeem`.
 *
 * @example
 * ConfirmRedemptionInput.create({ reference: "ord_2" });
 */
export class ConfirmRedemptionInput extends Schema {
  /** Public id of the thing paid for (`ord_…`); the path parameter of the endpoint. */
  @Str({ min: 1, max: 120 })
  reference!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ConfirmRedemptionInput, z.object({ reference: z.string().min(1).max(120) })]]);

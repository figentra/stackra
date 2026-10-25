/**
 * Stackra file contract:
 * Purpose: `ConfirmRedemptionOutput`, the output of `loyalty_kit.points.confirm_redemption@1`: the confirmed reference.
 * Boundary: a shape class in its own file; the redemption's own result arrives as the redeem action's output, so this
 *           carries only the reference. It registers its schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * The confirmed reference.
 *
 * @example
 * return ConfirmRedemptionOutput.create({ reference: input.reference });
 */
export class ConfirmRedemptionOutput extends Schema {
  /** The reference that was confirmed. */
  reference!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ConfirmRedemptionOutput, z.object({ reference: z.string() })]]);

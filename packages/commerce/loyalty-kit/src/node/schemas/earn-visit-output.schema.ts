/**
 * Stackra file contract:
 * Purpose: `EarnVisitOutput`, the output of `loyalty_kit.points.earn_visit@1`: the stamps credited now (zero for a
 *          repeated visit) and the card they leave.
 * Boundary: a shape class in its own file; built with `EarnVisitOutput.create`. It registers its schema when the
 *           module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); the PUT-133 answer.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * The stamps and the card.
 *
 * @example
 * return EarnVisitOutput.create({ stamps: 1, onCard: 4, perCard: 10, fullCards: 0 });
 */
export class EarnVisitOutput extends Schema {
  /** Stamps credited by this call. */
  stamps!: number;

  /** Stamps on the card being filled. */
  onCard!: number;

  /** Stamps one card holds. */
  perCard!: number;

  /** Full cards ready to redeem. */
  fullCards!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    EarnVisitOutput,
    z.object({
      stamps: z.number().int().min(0),
      onCard: z.number().int().min(0),
      perCard: z.number().int().min(1),
      fullCards: z.number().int().min(0),
    }),
  ],
]);

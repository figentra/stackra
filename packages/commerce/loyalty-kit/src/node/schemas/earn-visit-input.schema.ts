/**
 * Stackra file contract:
 * Purpose: `EarnVisitInput`, the input of `loyalty_kit.points.earn_visit@1`: whose visit, and the visit it is (the
 *          reference a repeat stamps nothing twice for).
 * Boundary: a shape class in its own file. The stamp count is not input: it is the `stampsPerVisit` setting. It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); the PUT-133 answer.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * A visit to stamp.
 *
 * @example
 * EarnVisitInput.create({ principalId: "usr_1", reference: "apt_42" });
 */
export class EarnVisitInput extends Schema {
  /** The member's principal public id. */
  @Str({ min: 1 })
  principalId!: string;

  /** The visit (an appointment, an order) the stamps are for. */
  @Str({
    min: 1,
    max: 128,
  })
  reference!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    EarnVisitInput,
    z.object({ principalId: z.string().min(1), reference: z.string().min(1).max(128) }),
  ],
]);

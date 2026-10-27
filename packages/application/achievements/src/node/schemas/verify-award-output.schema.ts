/**
 * Stackra file contract:
 * Purpose: `VerifyAwardOutput`, the output of `achievements.award.verify@1`: the award's status (`valid`, or
 *          `not_found` for an unknown, malformed or revoked token or code) and, when valid, the verified award.
 * Boundary: a shape class in its own file. A stranger cannot tell a revoked award from one that never existed: the
 *           verification row is deleted on revoke (ADR 0368 decision 5). The award names its recipient by model and
 *           public id only; the consumer's page decides what else to show. It registers its schema when the module
 *           loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0432 (decision 1); ADR 0368 (decision 5); ADR 0294 (decisions 4, 13 and 26).
 */
import { Field, publicId, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { VerifiedAward } from "#contracts/index";

/**
 * A verify result.
 *
 * @example
 * return VerifyAwardOutput.create({ status: "valid", award });
 */
export class VerifyAwardOutput extends Schema {
  /** `valid` or `not_found`. */
  // reason: a two-value literal union kept as published, so the public verify page's type does not change
  @Field(z.enum(["valid", "not_found"]))
  status!: "valid" | "not_found";

  /** The verified award; null when not found. */
  // reason: `VerifiedAward` is a contracts interface the consumer's page shares, and it ships no `VerifiedAward$`
  @Field(
    z
      .object({
        awardId: publicId("awd"),
        kindId: publicId("awk"),
        kindName: z.string(),
        level: z.string().nullable(),
        period: z.string().nullable(),
        recipient: z.object({ model: z.string(), id: z.string() }),
        grantedAt: z.date(),
      })
      .nullable(),
  )
  award!: VerifiedAward | null;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    VerifyAwardOutput,
    z.object({
      status: z.enum(["valid", "not_found"]),
      award: z
        .object({
          awardId: z.string(),
          kindId: z.string(),
          kindName: z.string(),
          level: z.string().nullable(),
          period: z.string().nullable(),
          recipient: z.object({ model: z.string(), id: z.string() }),
          grantedAt: z.date(),
        })
        .nullable(),
    }),
  ],
]);

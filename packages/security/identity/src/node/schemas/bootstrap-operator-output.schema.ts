/**
 * Stackra file contract:
 * Purpose: `BootstrapOperatorOutput`, what `identity.operator.bootstrap@1` answers: its outcome, the role and, when a
 *          user was found, the user's public id.
 * Boundary: a schema; carries no email.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1586.
 */
import { Enum } from "@stackra/contracts";
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

import { OperatorBootstrapOutcome } from "#contracts/index";

/** A bootstrap's result. */
export class BootstrapOperatorOutput extends Schema {
  /** The role key given or checked. */
  @Str({
    min: 1,
    max: 120,
  })
  role!: string;

  /** The user's public id; absent on `not_found`. */
  @Str({
    min: 1,
    max: 64,
  })
  userId?: string;

  /** What the call did. */
  outcome!: OperatorBootstrapOutcome;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    BootstrapOperatorOutput,
    z.object({
      outcome: z.enum(Enum.values(OperatorBootstrapOutcome)),
      role: z.string().min(1).max(120),
      userId: z.string().min(1).max(64).exactOptional(),
    }),
  ],
]);

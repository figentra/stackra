/**
 * Stackra file contract:
 * Purpose: `BootstrapOperatorInput`, what `identity.operator.bootstrap@1` takes: the operator's email, the role to give
 *          at the platform node, and whether to only report what it would do.
 * Boundary: a schema; the email is personal data, used for one lookup and never logged or audited.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1586.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** An operator to bootstrap. */
export class BootstrapOperatorInput extends Schema {
  /** The email the operator signs in with. */
  @Str({
    min: 3,
    max: 254,
  })
  email!: string;

  /** The role key to give at the platform node; `SystemRole.Owner` when absent. */
  @Str({
    min: 1,
    max: 120,
  })
  role?: string;

  /** True to look up and report only; nothing is written. */
  dryRun?: boolean;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    BootstrapOperatorInput,
    z.object({
      email: z.email().max(254),
      role: z.string().min(1).max(120).exactOptional(),
      dryRun: z.boolean().exactOptional(),
    }),
  ],
]);

/**
 * Stackra file contract:
 * Purpose: `ExpirePointsOutput`, the output of the `loyalty_kit.points.expire@1` job: accounts visited and points
 *          removed.
 * Boundary: a shape class in its own file; zeros are a normal result. It registers its schema when the module loads
 *           (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0328.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * What one run did.
 *
 * @example
 * return ExpirePointsOutput.create({ accounts: accounts.length, points });
 */
export class ExpirePointsOutput extends Schema {
  /** Accounts this run visited. */
  @Int({ min: 0 })
  accounts!: number;

  /** Points it expired across them. */
  @Int({ min: 0 })
  points!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ExpirePointsOutput,
    z.object({ accounts: z.number().int().min(0), points: z.number().int().min(0) }),
  ],
]);

/**
 * Stackra file contract:
 * Purpose: `ExpirePointsInput`, the input of the `loyalty_kit.points.expire@1` job: how many accounts one run visits.
 * Boundary: a shape class in its own file; the cron's `input` is checked against it by gen. It registers its schema
 *           when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0148.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * Accounts per run; the next tick takes the rest.
 *
 * @example
 * ExpirePointsInput.create({ batchSize: 500 });
 */
export class ExpirePointsInput extends Schema {
  /** How many accounts one run visits; the cron passes 500. */
  @Int({ min: 1, max: 5_000 })
  batchSize = 500;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [ExpirePointsInput, z.object({ batchSize: z.number().int().min(1).max(5_000).default(500) })],
]);

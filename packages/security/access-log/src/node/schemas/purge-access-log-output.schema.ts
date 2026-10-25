/**
 * Stackra file contract:
 * Purpose: `PurgeAccessLogOutput`, the output of the `access_log.access_log_entry.purge@1` job: how many records one run
 *          deleted.
 * Boundary: a shape class in its own file; zero is normal on a quiet day. It registers its schema when the module
 *           loads, so `PurgeAccessLogOutput.create` validates with no generated file (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0328.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * Records deleted by one run.
 *
 * @example
 * return PurgeAccessLogOutput.create({ deleted: 12 });
 */
export class PurgeAccessLogOutput extends Schema {
  /** How many records the run deleted. */
  @Int({ min: 0 })
  deleted!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PurgeAccessLogOutput, z.object({ deleted: z.number().int().min(0) })]]);

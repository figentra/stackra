/**
 * Stackra file contract:
 * Purpose: `PurgeSubjectExportsOutput`, the output of the `privacy.subject_export.purge@1` job: how many export zips
 *          it deleted.
 * Boundary: a shape class in its own file; it registers its schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0189 (decision 1); ADR 0294 (decisions 4 and 13); STA-1375.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** What an export purge deleted. */
export class PurgeSubjectExportsOutput extends Schema {
  /** How many zips the run deleted. */
  @Int({ min: 0 })
  deleted!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PurgeSubjectExportsOutput, z.object({ deleted: z.number().int().min(0) })]]);

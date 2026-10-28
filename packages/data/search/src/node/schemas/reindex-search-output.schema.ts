/**
 * Stackra file contract:
 * Purpose: `ReindexSearchOutput`, what one run of a search reindex job did: how many rows it indexed.
 * Boundary: a shape class in its own file. It registers its schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0404 (decision 3).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * What one run did.
 *
 * @example
 * return ReindexSearchOutput.create({ indexed: 812 });
 */
export class ReindexSearchOutput extends Schema {
  /** Rows this run indexed, across its models. */
  @Int({ min: 0 })
  indexed!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ReindexSearchOutput, z.object({ indexed: z.number().int().min(0) })]]);

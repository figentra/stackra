/**
 * Stackra file contract:
 * Purpose: `ExportAuditInput`, the input of `access_log.audit_log_entry.export@1`: the time range of the write audit to
 *          export; both ends optional.
 * Boundary: a shape class in its own file. The tenant is never an input: the table's policy limits the export to the
 *           caller's tenant (R-59). It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); STA-1579.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * Which write audits to export.
 *
 * @example
 * await pipeline.execute(ExportAuditAction, { from: new Date("2026-10-01"), to: new Date("2026-11-01") }, { actor });
 */
export class ExportAuditInput extends Schema {
  /** Only calls at or after this instant. */
  from?: Date;

  /** Only calls before this instant. */
  to?: Date;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ExportAuditInput,
    z.object({
      from: z.coerce.date().exactOptional(),
      to: z.coerce.date().exactOptional(),
    }),
  ],
]);

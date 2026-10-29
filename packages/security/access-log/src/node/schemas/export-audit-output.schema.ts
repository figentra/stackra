/**
 * Stackra file contract:
 * Purpose: `ExportAuditOutput`, the output of `access_log.audit_log_entry.export@1`: how many audit records one run
 *          pushed to the `AuditExportSink`.
 * Boundary: a shape class in its own file; zero is normal for an empty range. It registers its schema when the module
 *           loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0328; STA-1579.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * Records exported by one run.
 *
 * @example
 * return ExportAuditOutput.create({ exported: 240 });
 */
export class ExportAuditOutput extends Schema {
  /** How many records the run pushed. */
  @Int({ min: 0 })
  exported!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ExportAuditOutput, z.object({ exported: z.number().int().min(0) })]]);

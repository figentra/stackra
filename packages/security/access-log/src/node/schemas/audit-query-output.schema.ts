/**
 * Stackra file contract:
 * Purpose: `AuditQueryOutput`, the output of `access_log.audit_log_entry.search@1`: one cursor page of write audits,
 *          newest first.
 * Boundary: a shape class in its own file, `Page.of(AuditLogEntryView)`. It registers its schema when the module loads
 *           (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 26: `Page.of`); ADR 0305 (one declaration per file); the HTTP
 *                     conventions (cursor pagination).
 */
import { Page, registerSchemas, schemaOf } from "@stackra/validation";
import { z } from "zod";

import { AuditLogEntryView } from "#node/schemas/audit-log-entry-view.schema";

/**
 * One page of write audits.
 *
 * @example
 * return AuditQueryOutput.create({ items, hasMore: false });
 */
export class AuditQueryOutput extends Page.of(AuditLogEntryView) {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AuditQueryOutput,
    z.object({
      items: z.array(schemaOf(AuditLogEntryView)),
      nextCursor: z.string().exactOptional(),
      hasMore: z.boolean(),
    }),
  ],
]);

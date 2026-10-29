/**
 * Stackra file contract:
 * Purpose: `ExportAuditAction`, `access_log.audit_log_entry.export@1`: streams the tenant's write audit in a time range
 *          to the `AuditExportSink` (a SIEM or an object store) as NDJSON, one batch per page.
 * Boundary: a job (fifteen minutes at most) a user, a service or the platform dispatches; its permission
 *           `access_log.audit_log_entry.export` is L2, as it moves who-did-what out of the platform. It reads through
 *           `AuditQuery`'s paging (newest first, 100 a page, the cursor its sequence), so the tenant is the table
 *           policy's, never an input (R-59). Each line is one `AuditLogEntryView` with its chain fields, so the
 *           receiver verifies consecutive lines with `findAuditChainBreak`. A failed push fails the run; a retry
 *           re-sends the range from the start (the receiver dedupes on `id`). The run itself is audited by the
 *           pipeline, like every action.
 * Runtime: node
 * Governing contract: ADR 0465 (decision 4); ADR 0212 (decision 3); ADR 0294 (decisions 16 and 21); ADR 0305 (rule 28:
 *                     the job surface); ADR 0462 (permissions in @stackra/iam's idiom); STA-1579.
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { Repository } from "@stackra/database";

import type { AuditExportSink } from "#contracts/ports/audit-export-sink.port";
import { AuditLogEntryPermissions } from "#node/access/audit-log-entry.permissions";
import type { AuditLogEntry } from "#node/models/audit-log-entry.model";
import { AuditQuery } from "#node/queries/audit.query";
import type { ExportAuditInput } from "#node/schemas/export-audit-input.schema";
import { ExportAuditOutput } from "#node/schemas/export-audit-output.schema";
import { AuditQueryInput } from "#node/schemas/audit-query-input.schema";

/** Records per page and per pushed batch: `AuditQueryInput`'s largest page. */
const PAGE = 100;

/**
 * Pushes the write audit of a range to the export sink.
 *
 * @example
 * const { exported } = await pipeline.execute(ExportAuditAction, { from, to }, { actor });
 */
export class ExportAuditAction extends Action({
  key: "audit_log_entry.export",
  permission: AuditLogEntryPermissions.export,
  actors: [ActorKind.User, ActorKind.Service, ActorKind.System],
  job: { timeout: "15m" },
}) {
  /** The audit reader whose paging the export reuses. */
  private readonly query: AuditQuery;

  /** Where each batch goes. */
  private readonly sink: AuditExportSink;

  /**
   * @param entries - the write audit table, tenant-scoped by its policy.
   * @param sink - the export receiver.
   */
  constructor(entries: Repository<AuditLogEntry>, sink: AuditExportSink) {
    super();
    this.query = new AuditQuery(entries);
    this.sink = sink;
  }

  /** Pages through the range and pushes each non-empty page as one NDJSON batch. */
  async handle(input: ExportAuditInput): Promise<ExportAuditOutput> {
    let exported = 0;
    let cursor: string | undefined;
    do {
      const page = await this.query.handle(
        AuditQueryInput.create({
          limit: PAGE,
          ...(input.from === undefined ? {} : { from: input.from }),
          ...(input.to === undefined ? {} : { to: input.to }),
          ...(cursor === undefined ? {} : { cursor }),
        }),
      );
      if (page.items.length > 0) {
        await this.sink.push(page.items.map((item) => `${JSON.stringify(item)}\n`).join(""));
        exported += page.items.length;
      }
      cursor = page.nextCursor;
    } while (cursor !== undefined);
    return ExportAuditOutput.create({ exported });
  }
}

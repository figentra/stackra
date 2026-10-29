/**
 * Stackra file contract:
 * Purpose: `AuditExportSink`, the port `ExportAuditAction` pushes the write audit to, one NDJSON batch per page: a
 *          SIEM's HTTPS collector, an object store, or a host's own forwarder.
 * Boundary: an abstract class that is its own token, key `access_log.AuditExportSink`. Optional: a host that exports
 *           nothing binds none, and the export job is then never dispatched. The package ships one driver
 *           (`https`, a `fetch` POST); a host's own class is marked `@Replaces(AuditExportSink)`. A leaf file: it
 *           imports nothing outside src/contracts.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: the audit leaves the platform verifiable); ADR 0465 (decision 4); ADR 0294
 *                     (decisions 15, 16 and 17); STA-1579.
 */
import { Port } from "@stackra/contracts";

/**
 * Receives exported audit records.
 *
 * @example
 * export class SplunkAuditExportSinkDriver extends Driver(AuditExportSink) {
 *   async push(ndjson: string): Promise<void> {
 *     await this.hec.send(ndjson);
 *   }
 * }
 */
export abstract class AuditExportSink extends Port {
  /** Type-only port key, so `DriverName<AuditExportSink>` narrows to this port's drivers. */
  declare readonly "~key": "access_log.AuditExportSink";

  /**
   * Stores one batch: one `AuditLogEntryView` per line as JSON, each line ending in `\n`, chain fields included so the
   * receiver can verify with `findAuditChainBreak`. Resolves once the batch is accepted; a rejection fails the export.
   */
  abstract push(ndjson: string): Promise<void>;
}

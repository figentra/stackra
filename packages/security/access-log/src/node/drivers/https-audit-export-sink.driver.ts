/**
 * Stackra file contract:
 * Purpose: `HttpsAuditExportSinkDriver`, the `https` driver of `AuditExportSink`: each NDJSON batch is one `fetch` POST
 *          (`content-type: application/x-ndjson`) to `AccessLogConfig.exportUrl`, with the `ACCESS_LOG_EXPORT_TOKEN`
 *          secret as a bearer token when it is set; a SIEM's HTTPS collector (Splunk HEC, Datadog, Elastic, a log
 *          shipper) takes it as is.
 * Boundary: implements the port only. It refuses an unset endpoint, and the config schema refuses one that is not
 *           HTTPS, so audit records never travel in clear text. Anything but a 2xx answer, or a network failure, is
 *           `AuditExportFailedError` (retryable); the token and the records never reach the error. Server only: it
 *           holds a secret. No S3 driver ships: this package has no S3 client (a host's own class replaces this one).
 * Runtime: node
 * Governing contract: ADR 0212 (decision 3); ADR 0294 (decisions 15 and 16); ADR 0173; STA-1579.
 */
import { Driver } from "@stackra/container";

import type { AccessLogConfig } from "#config/access-log.config";
import { AuditExportSink } from "#contracts/ports/audit-export-sink.port";
import { AuditExportFailedError } from "#core/errors/audit-export-failed.error";

/**
 * Posts audit batches to an HTTPS collector.
 *
 * @example
 * // runway: config.access_log.exportUrl = https://siem.acme.example/ingest; secret ACCESS_LOG_EXPORT_TOKEN
 */
export class HttpsAuditExportSinkDriver extends Driver(AuditExportSink) {
  /** The endpoint and its token. */
  private readonly config: AccessLogConfig;

  /**
   * @param config - the access log's configuration.
   */
  constructor(config: AccessLogConfig) {
    super();
    this.config = config;
  }

  /**
   * Posts `ndjson` to the configured endpoint.
   *
   * @throws AuditExportFailedError when the endpoint is unset, unreachable or answers other than 2xx.
   */
  override async push(ndjson: string): Promise<void> {
    const { exportUrl, exportToken } = this.config;
    if (exportUrl === "")
      throw AuditExportFailedError.create(
        {},
        { cause: new Error("AccessLogConfig.exportUrl is unset") },
      );
    let response: Response;
    try {
      response = await fetch(exportUrl, {
        method: "POST",
        headers: {
          "content-type": "application/x-ndjson",
          ...(exportToken === "" ? {} : { authorization: `Bearer ${exportToken}` }),
        },
        body: ndjson,
      });
    } catch (error) {
      throw AuditExportFailedError.create({}, { cause: error });
    }
    if (!response.ok)
      throw AuditExportFailedError.create({}, { cause: new Error(`HTTP ${response.status}`) });
  }
}

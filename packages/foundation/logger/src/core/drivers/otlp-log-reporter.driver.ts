/**
 * Stackra file contract:
 * Purpose: the OTLP driver of the `LogReporter` port (driver name `otlp`, the production default of ADR 0147): records
 *          are batched and POSTed as OTLP/JSON to `<endpoint>/v1/logs`, a full batch at once and the rest after
 *          `flushIntervalMs`.
 * Boundary: no vendor SDK: the shared `otlpExporter` over web-standard `fetch`, so it runs in a service and a Worker.
 *           `report` is synchronous and never throws (the port's contract): it queues and returns. A failed send drops
 *           its batch; past `maxQueue` the oldest records are dropped; both are counted in `dropped`, so a dead
 *           collector never grows memory without bound. The headers secret is read once through the `SecretStore`
 *           port. With no endpoint nothing is queued. `flush()` sends what is queued and waits for every send (call it
 *           before a process or a Worker request ends); shutdown flushes too.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: OTLP driver); ADR 0184 (decisions 1, 2 and 5); ADR 0173 (secrets by name).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import type { OtlpConfig } from "#config/otlp.config";
import { LogReporter } from "#contracts/ports/log-reporter.port";
import type { LogRecord } from "#contracts/types/log-record.type";
import { otlpExporter } from "#core/functions/otlp-exporter.function";
import { otlpLogsBody } from "#core/functions/otlp-logs-body.function";
import type { OtlpExporter } from "#core/types/otlp-exporter.type";

/**
 * Sends records to an OpenTelemetry collector.
 *
 * @example
 * // runway.yaml (production): config.logger.otlp: { endpoint: https://otlp.example.test, serviceName: orders }
 * reporter.report(record);
 * await reporter.flush();
 */
export class OtlpLogReporterDriver extends Driver(LogReporter) {
  private readonly exporter: OtlpExporter<LogRecord>;

  /**
   * @param config - the collector, the service name, the headers secret's name and the batching bounds.
   * @param secrets - the store the headers are read from.
   */
  constructor(config: OtlpConfig, secrets: SecretStore) {
    super();
    this.exporter = otlpExporter(config, secrets, "logs", (batch) =>
      otlpLogsBody(batch, config.serviceName),
    );
  }

  /** Records dropped so far (queue overflow, or a batch the collector refused or never answered). */
  get dropped(): number {
    return this.exporter.dropped;
  }

  /** Sends what is queued before the container closes. */
  onApplicationShutdown(): Promise<void> {
    return this.flush();
  }

  /** Queues `record`; sends the batch when it is full. */
  report(record: LogRecord): void {
    this.exporter.push(record);
  }

  /** Sends every queued record and resolves once all sends have finished or failed. */
  flush(): Promise<void> {
    return this.exporter.flush();
  }
}

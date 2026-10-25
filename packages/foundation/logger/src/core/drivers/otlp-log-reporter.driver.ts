/**
 * Stackra file contract:
 * Purpose: the OTLP driver of the `LogReporter` port (driver name `otlp`, the production default of ADR 0147): records
 *          are batched and POSTed as OTLP/JSON to `<endpoint>/v1/logs`, a full batch at once and the rest after
 *          `flushIntervalMs`.
 * Boundary: no vendor SDK: web-standard `fetch` only, so it runs in a service and a Worker. `report` is synchronous and
 *           never throws (the port's contract): it queues and returns. A failed send drops its batch; past `maxQueue`
 *           the oldest records are dropped, so a dead collector never grows memory without bound. The headers secret
 *           is read once through the `SecretStore` port. With no endpoint nothing is queued. `flush()` sends what is
 *           queued and waits for every send (call it before a process or a Worker request ends).
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: OTLP driver); ADR 0184 (decisions 1, 2 and 5); ADR 0173 (secrets by name).
 */
import { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import { OtlpConfig } from "#config/otlp.config";
import { LogReporter } from "#contracts/ports/log-reporter.port";
import type { LogRecord } from "#contracts/types/log-record.type";
import { otlpHeaders } from "#core/functions/otlp-headers.function";
import { otlpLogsBody } from "#core/functions/otlp-logs-body.function";

/**
 * Sends records to an OpenTelemetry collector.
 *
 * @example
 * // runway.yaml (production): config.logger.otlp: { endpoint: https://otlp.example.test, serviceName: orders }
 * reporter.report(record);
 * await reporter.flush();
 */
export class OtlpLogReporterDriver extends Driver(LogReporter) {
  private readonly config: OtlpConfig;

  private readonly secrets: SecretStore;

  private readonly queue: LogRecord[] = [];

  private readonly inFlight = new Set<Promise<void>>();

  private timer: ReturnType<typeof setTimeout> | undefined;

  private headers: Readonly<Record<string, string>> | undefined;

  /**
   * @param config - the collector, the service name, the headers secret's name and the batching bounds.
   * @param secrets - the store the headers are read from.
   */
  constructor(config: OtlpConfig, secrets: SecretStore) {
    super();
    this.config = config;
    this.secrets = secrets;
  }

  /** Queues `record`; sends the batch when it is full. */
  report(record: LogRecord): void {
    if (this.config.endpoint === "") return;
    this.queue.push(record);
    if (this.queue.length > this.config.maxQueue)
      this.queue.splice(0, this.queue.length - this.config.maxQueue);
    if (this.queue.length >= this.config.batchSize) {
      this.send();
      return;
    }
    this.schedule();
  }

  /** Sends every queued record and resolves once all sends have finished or failed. */
  async flush(): Promise<void> {
    while (this.queue.length > 0) this.send();
    await Promise.all(this.inFlight);
  }

  /** Sends one batch from the front of the queue. */
  private send(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    const batch = this.queue.splice(0, this.config.batchSize);
    if (batch.length === 0) return;
    try {
      this.headers ??= otlpHeaders(this.secrets.get(this.config.headersSecret));
      const sent = globalThis
        .fetch(`${this.config.endpoint.replace(/\/+$/, "")}/v1/logs`, {
          method: "POST",
          headers: { ...this.headers, "content-type": "application/json" },
          body: JSON.stringify(otlpLogsBody(batch, this.config.serviceName)),
        })
        .then(
          () => undefined,
          () => undefined,
        );
      this.inFlight.add(sent);
      void sent.finally(() => this.inFlight.delete(sent));
    } catch {
      // A throwing fetch drops the batch; logging never fails its caller.
    }
    if (this.queue.length > 0) this.schedule();
  }

  /** Sends the queue's front after `flushIntervalMs`, unless a send is already scheduled. */
  private schedule(): void {
    if (this.timer !== undefined) return;
    this.timer = setTimeout(() => this.send(), this.config.flushIntervalMs);
    // A pending flush must not keep a Node process alive; Workers and browsers have no `unref`.
    (this.timer as { unref?: () => void }).unref?.();
  }
}

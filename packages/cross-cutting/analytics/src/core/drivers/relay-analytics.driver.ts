/**
 * Stackra file contract:
 * Purpose: the `relay` driver of the `AnalyticsDriver` port (ADR 0483 decision 1): posts the deliveries it is handed,
 *          unchanged, as one batch to the analytics service (`POST <ingestOrigin>/public/analytics/batches`), with the
 *          `Stackra-Consent` header of a snapshot the consent endpoint under the same origin signed.
 * Boundary: plain `fetch`, no vendor key, no vendor SDK, no cookie and no storage. `AnalyticsClient` keeps the consent
 *           gate, the queue and the retries and calls `send` only once the category is granted; the server applies the
 *           same decision again. The snapshot is asked for the batch's anonymous id as subject (the server binds every
 *           delivery to it) through `consentSnapshotHeaders`, which holds it in memory and refetches when the decision
 *           or the subject changes; a missing snapshot sends no header and the server drops the batch. A missing
 *           ingest origin or an error status rejects, and the client retries. No beacon: `sendBeacon` cannot carry
 *           the consent header, so a closing page falls back to `send` with `keepalive`.
 * Runtime: isomorphic
 * Governing contract: ADR 0483 (decisions 1 and 2); ADR 0472 (decisions 1 and 3); ADR 0298 (decisions 1 and 5);
 *                     ADR 0266 (one option, one driver).
 */
import { consentSnapshotHeaders, type ConsentLedger } from "@stackra/consent";
import { Driver } from "@stackra/container";

import type { AnalyticsConfig } from "#config/analytics.config";
import { ANALYTICS_INGEST_PATH } from "#contracts/constants/analytics-ingest-path.constant";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/**
 * Sends analytics events to the analytics service.
 *
 * @example
 * const driver = new RelayAnalyticsDriver(buildConfig(AnalyticsConfig, { values: { ingestOrigin: "https://api.example.com" } }), ledger);
 * await driver.send(deliveries); // the envelope v2 deliveries `AnalyticsClient` builds after consent
 */
export class RelayAnalyticsDriver extends Driver(AnalyticsDriver) {
  /** Holds the ingest origin (the public API origin). */
  protected readonly config: AnalyticsConfig;

  /** The `Stackra-Consent` header of the current decision and subject. */
  private readonly consentHeaders: () => Promise<Readonly<Record<string, string>>>;

  /** The anonymous id the next snapshot is asked for. */
  private subject: string | undefined;

  /**
   * @param config - holds the ingest origin.
   * @param ledger - the consent decision a snapshot is asked for.
   */
  constructor(config: AnalyticsConfig, ledger: ConsentLedger) {
    super();
    this.config = config;
    this.consentHeaders = consentSnapshotHeaders({
      baseUrl: config.ingestOrigin,
      snapshotRequest: () => ledger.snapshotRequest(this.subject),
    });
  }

  /**
   * Posts `deliveries` to the analytics service in the order given.
   *
   * @throws Error when no ingest origin is configured, the request fails or the service answers with an error status.
   */
  send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    return this.post(deliveries);
  }

  /**
   * One ingest request for `deliveries`; nothing is requested for an empty list.
   *
   * @throws Error when no ingest origin is configured, the request fails or the service answers with an error status.
   */
  protected async post(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    if (deliveries.length === 0) return;
    const origin = this.config.ingestOrigin.replace(/\/+$/, "");
    if (origin === "")
      throw new Error(
        "AnalyticsConfig.ingestOrigin is not set, so the relay has no analytics service to send to",
      );
    this.subject = deliveries.at(-1)?.anonymousId;
    const response = await fetch(`${origin}${ANALYTICS_INGEST_PATH}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(await this.consentHeaders()) },
      // Lets the last events of a closing page still arrive.
      keepalive: true,
      body: JSON.stringify({ deliveries }),
    });
    if (!response.ok)
      throw new Error(`The analytics service answered the batch with HTTP ${response.status}`);
  }
}

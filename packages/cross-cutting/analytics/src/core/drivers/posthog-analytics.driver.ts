/**
 * Stackra file contract:
 * Purpose: the `posthog` driver of the `AnalyticsDriver` port: posts the deliveries it is handed, in order, to
 *          PostHog's batch capture endpoint (`POST <ingestOrigin or posthogHost>/batch/`) with the project key.
 * Boundary: plain `fetch`, no vendor SDK, no cookie and no storage. `AnalyticsClient` keeps the consent gate and the
 *           bounded queue and calls `send` only once the category is granted. The driver makes no id of its own: the
 *           delivery's `anonymousId` is the `distinct_id`, its `sessionId` the `$session_id`, its `eventId` the
 *           `$insert_id` and its page path the `$pathname`; every event is sent with `$process_person_profile: false`,
 *           so PostHog builds no person profile from it. Each delivery's capture time is its `timestamp`. A missing
 *           key or an error status rejects; the client swallows it.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0071 (no identifier before consent); ADR 0294 (decisions 16
 *                     and 17); ADR 0266 (one option, one driver).
 */
import { Driver } from "@stackra/container";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/**
 * Sends analytics events to PostHog.
 *
 * @example
 * const driver = new PosthogAnalyticsDriver(buildConfig(AnalyticsConfig, { values: { posthogKey: "phc_..." } }));
 * await driver.send(deliveries); // the envelope v2 deliveries `AnalyticsClient` builds after consent
 */
export class PosthogAnalyticsDriver extends Driver(AnalyticsDriver) {
  /** Holds the PostHog key and host, the ingest origin and the queue bound. */
  protected readonly config: AnalyticsConfig;

  /**
   * @param config - holds the PostHog project key and host and the ingest origin.
   */
  constructor(config: AnalyticsConfig) {
    super();
    this.config = config;
  }

  /**
   * Posts `deliveries` to PostHog in the order given.
   *
   * @throws Error when no PostHog key is configured, the request fails or PostHog answers with an error status.
   */
  send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    return this.post(deliveries);
  }

  /**
   * One batch capture request for `deliveries`; nothing is requested for an empty list.
   *
   * @throws Error when no PostHog key is configured, the request fails or PostHog answers with an error status.
   */
  protected async post(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    if (deliveries.length === 0) return;
    const { posthogKey, posthogHost, ingestOrigin } = this.config;
    if (posthogKey === null || posthogKey === "")
      throw new Error("AnalyticsConfig.posthogKey is not set, so PostHog cannot be sent to");
    const response = await fetch(`${(ingestOrigin || posthogHost).replace(/\/+$/, "")}/batch/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Lets the last events of a closing page still arrive.
      keepalive: true,
      body: JSON.stringify({
        api_key: posthogKey,
        batch: deliveries.map((delivery) => ({
          event: delivery.name,
          timestamp: delivery.occurredAt,
          properties: {
            ...delivery.properties,
            distinct_id: delivery.anonymousId,
            $session_id: delivery.sessionId,
            $insert_id: delivery.eventId,
            ...(delivery.context.page ? { $pathname: delivery.context.page.path } : {}),
            $process_person_profile: false,
          },
        })),
      }),
    });
    if (!response.ok)
      throw new Error(`PostHog answered the batch capture with HTTP ${response.status}`);
  }
}

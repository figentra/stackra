/**
 * Stackra file contract:
 * Purpose: the `posthog` driver of the `AnalyticsDriver` port: posts the deliveries it is handed, in order, to
 *          PostHog's batch capture endpoint (`POST <ingestOrigin or posthogHost>/batch/`) with the project key.
 * Boundary: plain `fetch`, no vendor SDK, no cookie and no storage. `AnalyticsClient` keeps the consent gate and the
 *           bounded queue and calls `send` only once the category is granted. The driver makes no id of its own: the
 *           delivery's `userId` (once identified) or else `anonymousId` is the `distinct_id`, its `sessionId` the
 *           `$session_id`, its `eventId` the `$insert_id`, its page path the `$pathname` and its groups `$groups`; an
 *           `identify` delivery is PostHog's `$identify` (with `$anon_distinct_id`, which merges the two) and a `group`
 *           delivery its `$groupidentify`. Only an identified visitor's events build a person profile
 *           (`$process_person_profile`). Each delivery's capture time is its `timestamp`. A missing
 *           key or an error status rejects, and the client's delivery engine retries the batch (the driver never
 *           does). `beacon` sends the same body through `navigator.sendBeacon` when the page closes.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0071 (no identifier before consent); ADR 0294 (decisions 16
 *                     and 17); ADR 0266 (one option, one driver).
 */
import { Driver } from "@stackra/container";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";

/** One PostHog batch item. */
interface PosthogEvent {
  readonly event: string;
  readonly timestamp: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

/**
 * The PostHog batch item of `delivery`: an event as `distinct_id` (the user once identified, else the anonymous id),
 * an `identify` as `$identify` with `$anon_distinct_id`, a `group` as `$groupidentify`; groups go in `$groups`. Only an
 * identified visitor gets a person profile.
 */
function posthogEventOf(delivery: AnalyticsDelivery): PosthogEvent {
  const kind = delivery.kind ?? AnalyticsDeliveryKind.Track;
  const common = {
    distinct_id: delivery.userId ?? delivery.anonymousId,
    $session_id: delivery.sessionId,
    $insert_id: delivery.eventId,
    ...(delivery.context.page ? { $pathname: delivery.context.page.path } : {}),
    ...(delivery.groups ? { $groups: delivery.groups } : {}),
    $process_person_profile: delivery.userId !== undefined,
  };
  if (kind === AnalyticsDeliveryKind.Identify)
    return {
      event: "$identify",
      timestamp: delivery.occurredAt,
      properties: { ...common, $anon_distinct_id: delivery.anonymousId },
    };
  if (kind === AnalyticsDeliveryKind.Group)
    return {
      event: "$groupidentify",
      timestamp: delivery.occurredAt,
      properties: {
        ...common,
        $group_type: String(delivery.properties.type),
        $group_key: String(delivery.properties.id),
      },
    };
  return {
    event: delivery.name,
    timestamp: delivery.occurredAt,
    properties: { ...delivery.properties, ...common },
  };
}

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
   * Hands `deliveries` to `navigator.sendBeacon` as one batch capture body, for a closing page; `false` where the
   * platform has no beacon (a server, React Native), no key is set, or the browser refuses the payload.
   */
  override beacon(deliveries: readonly AnalyticsDelivery[]): boolean {
    if (deliveries.length === 0) return true;
    const scope = globalThis as {
      readonly navigator?: { readonly sendBeacon?: (url: string, data: Blob) => boolean };
    };
    const send = scope.navigator?.sendBeacon;
    const { posthogKey } = this.config;
    if (typeof send !== "function" || posthogKey === null || posthogKey === "") return false;
    const { url, body } = this.requestOf(deliveries);
    return send.call(scope.navigator, url, new Blob([body], { type: "application/json" }));
  }

  /**
   * One batch capture request for `deliveries`; nothing is requested for an empty list.
   *
   * @throws Error when no PostHog key is configured, the request fails or PostHog answers with an error status.
   */
  protected async post(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    if (deliveries.length === 0) return;
    const { url, body } = this.requestOf(deliveries);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Lets the last events of a closing page still arrive.
      keepalive: true,
      body,
    });
    if (!response.ok)
      throw new Error(`PostHog answered the batch capture with HTTP ${response.status}`);
  }

  /**
   * The batch capture URL and JSON body of `deliveries`.
   *
   * @throws Error when no PostHog key is configured.
   */
  private requestOf(deliveries: readonly AnalyticsDelivery[]): { url: string; body: string } {
    const { posthogKey, posthogHost, ingestOrigin } = this.config;
    if (posthogKey === null || posthogKey === "")
      throw new Error("AnalyticsConfig.posthogKey is not set, so PostHog cannot be sent to");
    return {
      url: `${(ingestOrigin || posthogHost).replace(/\/+$/, "")}/batch/`,
      body: JSON.stringify({
        api_key: posthogKey,
        batch: deliveries.map((delivery) => posthogEventOf(delivery)),
      }),
    };
  }
}

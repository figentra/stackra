/**
 * Stackra file contract:
 * Purpose: `AnalyticsClient`, the one way an analytics event leaves the device: `track(LeadSubmitted.create({ plan }))`
 *          sends it through the selected `AnalyticsDriver` when the consent category is granted, keeps it in a bounded
 *          ordered queue while the visitor has not decided, and drops it on refusal; the queue is sent in order on
 *          acceptance and discarded unsent on refusal.
 * Boundary: a singleton service over `AnalyticsConfig`, the driver and the `ConsentLedger`, which alone decides (Global
 *           Privacy Control reads as a refusal there). Only the fields the event's schema declares leave, minus
 *           `denyProperties`; it attaches no identity of its own. A full queue drops the newest event, so the first
 *           view and the events before the answer survive. It watches the ledger only while events wait. A driver's
 *           failure never reaches the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 2 and 5); ADR 0305 (rule 20); ADR 0294 (decisions 16, 17 and 26).
 */
import type { ConsentLedger } from "@stackra/consent";
import { ConsentStatus } from "@stackra/consent";
import { type AnyClass, kindOf, Service } from "@stackra/container";
import type { Event } from "@stackra/events";
import { schemaOf } from "@stackra/validation";

import type { AnalyticsConfig } from "#config/analytics.config";
import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { AnalyticsState } from "#core/enums/analytics-state.enum";

/**
 * Delivers analytics events behind consent.
 *
 * @example
 * const analytics = useAnalytics();
 * analytics.track(LeadSubmitted.create({ plan })); // waits in the queue until the visitor decides
 */
export class AnalyticsClient extends Service {
  private readonly config: AnalyticsConfig;

  private readonly driver: AnalyticsDriver;

  private readonly ledger: ConsentLedger;

  private readonly queue: AnalyticsDelivery[] = [];

  private stopWatching: (() => void) | null = null;

  /**
   * @param config - the driver, the gating category, the queue bound and the deny list.
   * @param driver - the selected driver that sends.
   * @param ledger - the consent ledger that decides.
   */
  constructor(config: AnalyticsConfig, driver: AnalyticsDriver, ledger: ConsentLedger) {
    super();
    this.config = config;
    this.driver = driver;
    this.ledger = ledger;
  }

  /** Where delivery stands: the consent status of `AnalyticsConfig.consentCategory`, read now. */
  get state(): AnalyticsState {
    const status = this.ledger.status(this.config.consentCategory);
    if (status === ConsentStatus.Granted) return AnalyticsState.OptedIn;
    return status === ConsentStatus.Denied ? AnalyticsState.OptedOut : AnalyticsState.Pending;
  }

  /**
   * Sends `event` once its consent category allows: at once when granted, after the visitor accepts when undecided
   * (if the queue has room), never when refused.
   *
   * @param event - an instance of an `AnalyticsEvent({ name })` class, built with its `create`.
   * @throws TypeError when `event` is not an analytics event, or its class has no registered schema.
   * @throws ZodError when its fields break the class's schema.
   */
  track(event: Event): void {
    const delivery = this.deliveryOf(event);
    if (this.state !== AnalyticsState.Pending) {
      this.settle([delivery]);
      return;
    }
    if (this.queue.length < this.config.queueLimit) this.queue.push(delivery);
    this.stopWatching ??= this.ledger.subscribe(() => this.settle([]));
  }

  /** Once decided: sends what waited, then `latest`, on acceptance; drops both on refusal. Undecided keeps waiting. */
  private settle(latest: readonly AnalyticsDelivery[]): void {
    const state = this.state;
    if (state === AnalyticsState.Pending) return;
    const waited = this.queue.splice(0);
    this.stopWatching?.();
    this.stopWatching = null;
    if (state !== AnalyticsState.OptedIn) return;
    const deliveries = [...waited, ...latest];
    if (deliveries.length === 0) return;
    // A driver owns its retries; a failed send must never break the page that tracked.
    this.driver.send(deliveries).catch(() => undefined);
  }

  /** The delivery of `event`: its locked name, the fields its schema declares minus the deny list, the time now. */
  private deliveryOf(event: Event): AnalyticsDelivery {
    const type = event.constructor as AnyClass;
    const record = kindOf(type);
    if (record?.kind !== "analytics_event")
      throw new TypeError(
        `track() takes an AnalyticsEvent instance, got ${type.name || "an object"}`,
      );
    // Parsing again drops any field the schema does not declare, so nothing undeclared leaves the device.
    const fields = schemaOf(type).parse({ ...event }) as Record<string, unknown>;
    const denied = new Set(this.config.denyProperties);
    return {
      name: String(record.options.name),
      properties: Object.fromEntries(Object.entries(fields).filter(([key]) => !denied.has(key))),
      occurredAt: new Date().toISOString(),
    };
  }
}

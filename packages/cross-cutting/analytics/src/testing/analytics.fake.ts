/**
 * Stackra file contract:
 * Purpose: `AnalyticsFake`, the analytics a test hands to a render helper (`render(ui, { analytics })`): a real
 *          `AnalyticsClient` over the memory driver and its own in-memory `ConsentLedger`, which also records every
 *          event the code under test tracked (`events()`, `tracked`) and what actually left through consent
 *          (`delivered()`).
 * Boundary: test code only. It is the real client, not a mock, so the queue, its bound and the refusal behave as in the
 *           app; a render helper binds it as `AnalyticsClient` and its `consent` as `ConsentLedger`, so a banner's
 *           decision reaches it as it reaches the real package. Nothing is decided at first; two fakes never share
 *           state. The delivery engine sends each delivery at once (`flushAt: 1`, no window), so `delivered()` reads
 *           what left without waiting. Builds the consent ledger itself: no other package's `./testing` is imported.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owning package's ./testing); ADR 0266; ADR 0298.
 */
import { buildConfig } from "@stackra/config";
import { ConsentConfig, ConsentLedger, MemoryConsentStoreDriver } from "@stackra/consent";
import type { Event } from "@stackra/events";

import type { AnalyticsDelivery } from "#contracts/index";
import { AnalyticsClient, AnalyticsConfig, MemoryAnalyticsDriver } from "#core/index";

/**
 * An analytics client a test reads back.
 *
 * @example
 * const analytics = new AnalyticsFake();
 * analytics.track(LeadSubmitted.create({ plan: "pro" }));
 * expect(analytics.events()).toEqual([LeadSubmitted.create({ plan: "pro" })]);
 * expect(analytics.delivered()).toEqual([]); // nobody accepted yet
 */
export class AnalyticsFake extends AnalyticsClient {
  /** The consent ledger this client obeys; a test or the code under test decides through it. */
  readonly consent: ConsentLedger;

  private readonly memory: MemoryAnalyticsDriver;

  private readonly captured: Event[] = [];

  /** A client with nothing decided, the default configuration and the memory driver. */
  constructor() {
    const consent = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
    const memory = new MemoryAnalyticsDriver();
    super(
      buildConfig(AnalyticsConfig, {
        values: { driver: "memory", flushAt: 1, flushIntervalMs: 0 },
      }),
      memory,
      consent,
    );
    this.consent = consent;
    this.memory = memory;
  }

  /** Every event tracked so far, oldest first, whatever consent did with it. */
  get tracked(): readonly Event[] {
    return [...this.captured];
  }

  /** Tracks `event` as the real client does, then records it. */
  override track(event: Event): void {
    super.track(event);
    this.captured.push(event);
  }

  /** Every event tracked so far, oldest first, whatever consent did with it; the same list as `tracked`. */
  events(): Event[] {
    return [...this.captured];
  }

  /** What the driver received: only the events consent let through, in the order they left. */
  delivered(): readonly AnalyticsDelivery[] {
    return this.memory.delivered();
  }
}

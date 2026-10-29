/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `AnalyticsDriver` port: keeps every event it is handed, in order, for a host
 *          that selects `analytics.driver: memory` (an app's test runs, a preview) and for `fakeAnalytics`, which reads
 *          what actually left through consent.
 * Boundary: ships in `.`, because gen's wiring offers it as a driver candidate and production code never imports
 *           `./testing`; `./testing` reaches it through `#core`. Sends nothing; one list per instance, held in memory
 *           only. `send` stores before it resolves, so a test reads `delivered()` right after `track`. `erasePerson`
 *           records the subject (`erased()`) and drops the deliveries whose user or anonymous id is the subject.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0294 (decisions 15, 16 and 17); the
 *                     2026-10-25 owner ruling (./testing is test-only).
 */
import { Driver } from "@stackra/container";

import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/**
 * Keeps deliveries for assertions.
 *
 * @example
 * const driver = new MemoryAnalyticsDriver();
 * await driver.send(deliveries); // the envelope v2 deliveries `AnalyticsClient` builds after consent
 * expect(driver.delivered()).toHaveLength(1);
 */
export class MemoryAnalyticsDriver extends Driver(AnalyticsDriver) {
  private readonly deliveries: AnalyticsDelivery[] = [];

  private readonly subjects: string[] = [];

  /** Keeps `deliveries` in the order given. */
  send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    this.deliveries.push(...deliveries);
    return Promise.resolve();
  }

  /** Records `subject` and drops its deliveries; resolves 1 when it had any, else 0. */
  override erasePerson(subject: string): Promise<number> {
    this.subjects.push(subject);
    const before = this.deliveries.length;
    const kept = this.deliveries.filter(
      (delivery) => delivery.userId !== subject && delivery.anonymousId !== subject,
    );
    this.deliveries.splice(0, before, ...kept);
    return Promise.resolve(kept.length < before ? 1 : 0);
  }

  /** Every subject `erasePerson` was called with, oldest first. */
  erased(): readonly string[] {
    return [...this.subjects];
  }

  /** Every delivery kept so far, oldest first. */
  delivered(): readonly AnalyticsDelivery[] {
    return [...this.deliveries];
  }
}

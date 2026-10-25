/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `AnalyticsDriver` port: keeps every event it is handed, in order, for tests
 *          (`analytics.driver: memory`) and for `fakeAnalytics`, which reads what actually left through consent.
 * Boundary: test code only, so it ships in `./testing` and never in an app bundle; sends nothing. One list per
 *           instance; `send` stores before it resolves, so a test reads `delivered()` right after `track`.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0269 (decision 3); ADR 0294 (decisions 16 and
 *                     17).
 */
import { Driver } from "@stackra/container";

import { AnalyticsDriver } from "#contracts/index";
import type { AnalyticsDelivery } from "#contracts/index";

/**
 * Keeps deliveries for assertions.
 *
 * @example
 * const driver = new MemoryAnalyticsDriver();
 * await driver.send([{ name: "lead.submitted", properties: { plan: "pro" }, occurredAt }]);
 * expect(driver.delivered()).toHaveLength(1);
 */
export class MemoryAnalyticsDriver extends Driver(AnalyticsDriver) {
  private readonly deliveries: AnalyticsDelivery[] = [];

  /** Keeps `deliveries` in the order given. */
  send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    this.deliveries.push(...deliveries);
    return Promise.resolve();
  }

  /** Every delivery kept so far, oldest first. */
  delivered(): readonly AnalyticsDelivery[] {
    return [...this.deliveries];
  }
}

/**
 * Stackra file contract:
 * Purpose: the `none` driver of the `AnalyticsDriver` port: accepts every event and sends nothing, for dev, previews
 *          and the deployments that run without a product-analytics provider (on-prem, air-gapped).
 * Boundary: no network, no storage and no state. The default (`analytics.driver: none`), so a host that sets no driver
 *           never sends an event anywhere, whatever the visitor decided.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (one option, one driver); ADR 0298 (decision 1); ADR 0294 (decisions 16 and 17).
 */
import { Driver } from "@stackra/container";

import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";

/**
 * The `none` analytics driver: accepts every event and sends nothing.
 *
 * @example
 * await new NoneAnalyticsDriver().send(deliveries); // resolves, nothing leaves the device
 */
export class NoneAnalyticsDriver extends Driver(AnalyticsDriver) {
  /** Resolves at once and sends nothing. */
  send(): Promise<void> {
    return Promise.resolve();
  }
}

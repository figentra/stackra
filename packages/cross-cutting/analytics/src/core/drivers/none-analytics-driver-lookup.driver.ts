/**
 * Stackra file contract:
 * Purpose: the `none` driver of the `AnalyticsDriverLookup` port, the default: it knows no named instance, so only the
 *          `default` destination (the `AnalyticsConfig.driver` instance) can be used.
 * Boundary: stateless. `AnalyticsClient` refuses at construction a destination naming an instance this lookup does not
 *           know, so a misconfigured destination fails at boot instead of silently sending nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `none`); analytics gap 7 (stackra-407).
 */
import { Driver } from "@stackra/container";

import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { AnalyticsDriverLookup } from "#contracts/ports/analytics-driver-lookup.port";

/**
 * Knows no named driver instance.
 *
 * @example
 * new NoneAnalyticsDriverLookupDriver().driver("segment"); // undefined
 */
export class NoneAnalyticsDriverLookupDriver extends Driver(AnalyticsDriverLookup) {
  /** Always `undefined`: no named instance is known. */
  driver(_name: string): AnalyticsDriver | undefined {
    return undefined;
  }
}

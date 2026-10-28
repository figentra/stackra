/**
 * Stackra file contract:
 * Purpose: the `AnalyticsDriverLookup` port: hands `AnalyticsClient` the `AnalyticsDriver` instance a destination names
 *          (`AnalyticsConfig.destinations[].driver`), one of the named instances `AnalyticsConfig.drivers` declares.
 * Boundary: an abstract class that is its own token. Lookup only: the instances are built by the container from the
 *           `drivers` record (gen writes `named: "config:analytics.drivers"` for that `Record<string, DriverName<...>>`
 *           field). This package ships `none`, which knows no named instance; a container-backed driver that answers
 *           `container.get(named(AnalyticsDriver, name))` is the host runtime's (stackra-407 integration ask).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 17); ADR 0263 (decision 4); analytics gap 7 (stackra-407).
 */
import { Port } from "@stackra/contracts";

import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";

/**
 * Finds a named `AnalyticsDriver` instance.
 *
 * @example
 * const segment = lookup.driver("segment"); // undefined when no instance has that name
 */
export abstract class AnalyticsDriverLookup extends Port {
  /** The driver instance named `name` in `AnalyticsConfig.drivers`, or `undefined` when there is none. */
  abstract driver(name: string): AnalyticsDriver | undefined;
}

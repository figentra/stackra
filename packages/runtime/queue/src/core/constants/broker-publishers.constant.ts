/**
 * Stackra file contract:
 * Purpose: `BROKER_PUBLISHERS`, the driver names of the `BrokerPublisher` port this package ships: each is its driver
 *          file's prefix (`valkey-broker-publisher.driver.ts` is `valkey`).
 * Boundary: the stand-in for the names gen derives from the driver files; the shipped schema's `driver` enum and the
 *           `DriverRegistry` entry are both read from it, so the two never drift. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9); ADR 0148 (decision 3).
 */

/** The `BrokerPublisher` drivers of this package, by name. */
export const BROKER_PUBLISHERS = ["memory", "topic", "valkey"] as const;

/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of the `BrokerPublisher` port, so the `driver` field typed
 *          `DriverName<BrokerPublisher>` and a runway `queue.broker.driver` value take exactly this package's names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `BrokerOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { BROKER_PUBLISHERS } from "#core/constants/broker-publishers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `BrokerPublisher` (`memory`, `topic`, `valkey`). */
    "queue.BrokerPublisher": (typeof BROKER_PUBLISHERS)[number];
  }
}

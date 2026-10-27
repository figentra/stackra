/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of the `QueueDriver` port, so the `driver` field typed `DriverName<QueueDriver>`
 *          and a runway `queue.driver` value take exactly this package's driver names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `QueueOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { QUEUE_DRIVERS } from "#core/constants/queue-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `QueueDriver` (`postgres`, `memory`, `broker`). */
    "queue.QueueDriver": (typeof QUEUE_DRIVERS)[number];
  }
}

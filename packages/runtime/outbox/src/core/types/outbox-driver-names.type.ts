/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the four stores (messages, inbox, change log, cross-app deliveries), so
 *          `DriverName<OutboxDriver>`, `DriverName<InboxDriver>`, `DriverName<ChangeFeed>` and
 *          `DriverName<DeliveryDriver>` are `"postgres" | "memory"`.
 * Boundary: a module augmentation only; gen writes these entries from the drivers it finds once it compiles packages.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0142.
 */
import type { OUTBOX_DRIVERS } from "#core/constants/outbox-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `OutboxDriver` (`postgres`, `memory`). */
    "outbox.OutboxDriver": (typeof OUTBOX_DRIVERS)[number];
    /** The driver names of `InboxDriver` (`postgres`, `memory`). */
    "outbox.InboxDriver": (typeof OUTBOX_DRIVERS)[number];
    /** The driver names of `ChangeFeed` (`postgres`, `memory`). */
    "outbox.ChangeFeed": (typeof OUTBOX_DRIVERS)[number];
    /** The driver names of `DeliveryDriver` (`postgres`, `memory`). */
    "outbox.DeliveryDriver": (typeof OUTBOX_DRIVERS)[number];
  }
}

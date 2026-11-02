/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the three stores (messages, inbox, change log), so
 *          `DriverName<OutboxDriver>`, `DriverName<InboxDriver>` and `DriverName<ChangeFeed>` are `"postgres" | "memory"`.
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
    /** The driver names of `DeliveryDriver` (`postgres`, `memory`), picked by the same `outbox.driver`. */
    "outbox.DeliveryDriver": (typeof OUTBOX_DRIVERS)[number];
    /** The driver of `EventSigner`: a producer's own Ed25519 key (ADR 0511 decision 16). */
    "outbox.EventSigner": "ed25519";
    /** The driver of `InboxVerifier`: the keys the consumer's pinned contracts list. */
    "outbox.InboxVerifier": "contract";
    /** The driver of `SubscriberSource`: runway's values in `CrossAppConfig`. */
    "outbox.SubscriberSource": "config";
    /** The driver of `DeliveryTransport`: one `fetch` per delivery. */
    "outbox.DeliveryTransport": "fetch";
  }
}

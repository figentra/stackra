/**
 * Stackra file contract:
 * Purpose: `BOOT_SERVICES`, the package services a service's generated `boot.ts` resolves from the container for
 *          what the service declares: the outbox's writer, relay and inbox, the event bus, the segments service, the
 *          workflow's automations and the queue worker. Nothing injects them, so the wiring binds them from here.
 * Boundary: data only; `emitWiring` adds each one of a declared package to its worklist, which binds it with its
 *           dependencies from the package's manifest. It must name what `emitBoot` resolves; a test checks every
 *           golden service's boot against its wiring.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (the outbox and inbox); ADR 0148 (decision 6: the queue worker); STA-2664 (n).
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** For each set of packages, the services boot resolves when the service declares any of them. */
export const BOOT_SERVICES: readonly {
  readonly packages: readonly string[];
  readonly services: readonly ClassRef[];
}[] = [
  {
    packages: ["@stackra/outbox"],
    services: [
      { name: "OutboxWriterService", from: "@stackra/outbox/node" },
      { name: "OutboxRelayService", from: "@stackra/outbox/node" },
      { name: "InboxService", from: "@stackra/outbox/node" },
    ],
  },
  // The outbox depends on the bus, so boot connects one for either package.
  {
    packages: ["@stackra/outbox", "@stackra/events"],
    services: [{ name: "EventBus", from: "@stackra/events" }],
  },
  {
    packages: ["@stackra/segments"],
    services: [{ name: "SegmentService", from: "@stackra/segments/node" }],
  },
  {
    packages: ["@stackra/workflow"],
    services: [{ name: "AutomationService", from: "@stackra/workflow/node" }],
  },
  {
    packages: ["@stackra/queue"],
    services: [{ name: "QueueWorkerService", from: "@stackra/queue/node" }],
  },
];

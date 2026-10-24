/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `RealtimeTransport` port: links open in process, a test or an offline dev build
 *          pushes messages into them with `emit`, and `drop` loses them as a network would.
 * Boundary: no network and no token check. A link opens on the next microtask, as a real one does after its
 *           handshake; closing it reports nothing, `drop` reports `onClose` once per open link.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0266 (memory first); ADR 0269 (decision 3: fakes per capability).
 */
import { Driver } from "@stackra/container";

import { RealtimeTransport } from "#contracts/ports/realtime-transport.port";
import type { RealtimeLink } from "#contracts/types/realtime-link.type";
import type { RealtimeLinkHandlers } from "#contracts/types/realtime-link-handlers.type";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import type { RealtimeTarget } from "#contracts/types/realtime-target.type";

/**
 * Links in process.
 *
 * @example
 * transport.emit({ channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" });
 */
export class MemoryRealtimeTransportDriver extends Driver(RealtimeTransport) {
  private readonly links = new Set<RealtimeLinkHandlers>();

  /** Opens an in-process link; `onOpen` follows on the next microtask unless it was closed first. */
  open(_target: RealtimeTarget, handlers: RealtimeLinkHandlers): RealtimeLink {
    this.links.add(handlers);
    queueMicrotask(() => {
      if (this.links.has(handlers)) handlers.onOpen();
    });
    return {
      close: () => {
        this.links.delete(handlers);
      },
    };
  }

  /** How many links are open. */
  get size(): number {
    return this.links.size;
  }

  /** Delivers `message` to every open link. */
  emit(message: RealtimeMessage): void {
    for (const handlers of this.links) handlers.onMessage(message);
  }

  /** Loses every open link, reporting `onClose` to each. */
  drop(): void {
    const lost = [...this.links];
    this.links.clear();
    for (const handlers of lost) handlers.onClose();
  }
}

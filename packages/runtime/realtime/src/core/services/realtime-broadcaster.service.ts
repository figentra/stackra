/**
 * Stackra file contract:
 * Purpose: `RealtimeBroadcaster`, the server step that turns one occurrence of a broadcasting integration event into a
 *          data-free refresh: it derives the channel from the route's audience, keeps only the wire name and the
 *          occurrence id, and hands it to the selected `RealtimeDriver` with the route's permission.
 * Boundary: a singleton service; gen wires it after the outbox relay with one `BroadcastRoute` per broadcasting event,
 *           read from the committed manifest. The payload never leaves: the message has no field of the event. A
 *           channel it cannot derive throws, so a misdeclared event fails loudly instead of reaching a wider audience.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (amendment item 7: audience, default principal); ADR 0225 (notes of 0294 and
 *                     2026-10-23); ADR 0078 (decision 4: after commit).
 */
import { Service } from "@stackra/container";
import type { RecordedEvent } from "@stackra/events/contracts";

import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import { broadcastChannel } from "#core/functions/broadcast-channel.function";
import type { BroadcastRoute } from "#core/types/broadcast-route.type";

/**
 * Broadcasts committed integration events.
 *
 * @example
 * await broadcaster.broadcast(record, {
 *   name: "orders.order.paid.v1",
 *   module: "orders",
 *   permission: "orders.order.read",
 *   audience: BroadcastAudience.Tenant,
 * });
 */
export class RealtimeBroadcaster extends Service {
  private readonly driver: RealtimeDriver;

  /** @param driver - the selected server driver. */
  constructor(driver: RealtimeDriver) {
    super();
    this.driver = driver;
  }

  /**
   * Publishes the refresh of `record` under `route`.
   *
   * @returns how many sessions it reached.
   * @throws TypeError (as a rejection) when the channel cannot be derived (no tenant or principal id on the occurrence).
   */
  async broadcast(record: RecordedEvent, route: BroadcastRoute): Promise<number> {
    const channel = broadcastChannel(route, record);
    return this.driver.publish({
      permission: route.permission,
      message: { channel, name: route.name, id: record.meta.id },
    });
  }
}

/**
 * Stackra file contract:
 * Purpose: `RealtimeRelay`, the fan-out of a service that runs more than one instance: `broadcast` hands a committed
 *          event's data-free refresh to the `RealtimeFanout` instead of this instance's driver, and `start` delivers
 *          what any instance fanned out to this instance's sessions (through the `RealtimeDriver`) and room members
 *          (through `RealtimeRooms`).
 * Boundary: a singleton service; the runtime calls `start` once at boot and the returned stop at shutdown. Gen wires
 *           `broadcast` in place of `RealtimeBroadcaster.broadcast` when `realtime.fanout` is not `local`; with the
 *           `local` fanout the two deliver the same. The channel is derived exactly as the broadcaster derives it, so a
 *           misdeclared event throws here too.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: Valkey or Postgres pub/sub fan-out); ADR 0346 (decision 5); ADR 0078
 *                     (decision 4: after commit).
 */
import { Service } from "@stackra/container";
import type { RecordedEvent } from "@stackra/events/contracts";

import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";
import { broadcastChannel } from "#core/functions/broadcast-channel.function";
import { RealtimeRooms } from "#core/services/realtime-rooms.service";
import type { BroadcastRoute } from "#core/types/broadcast-route.type";

/**
 * Relays broadcasts and room frames across instances.
 *
 * @example
 * const stop = relay.start();
 * await relay.broadcast(record, route);
 */
export class RealtimeRelay extends Service {
  private readonly fanout: RealtimeFanout;

  private readonly driver: RealtimeDriver;

  private readonly rooms: RealtimeRooms;

  /**
   * @param fanout - the transport between instances.
   * @param driver - this instance's sessions.
   * @param rooms - this instance's room members.
   */
  constructor(fanout: RealtimeFanout, driver: RealtimeDriver, rooms: RealtimeRooms) {
    super();
    this.fanout = fanout;
    this.driver = driver;
    this.rooms = rooms;
  }

  /**
   * Delivers every fanned-out message to this instance's sessions and room members.
   *
   * @returns stops delivering.
   */
  start(): () => void {
    return this.fanout.subscribe((message) => {
      if (message.kind === "broadcast") void this.driver.publish(message.broadcast).catch(() => 0);
      else this.rooms.receive(message);
    });
  }

  /**
   * Fans out the refresh of `record` under `route` to every instance.
   *
   * @throws TypeError (as a rejection) when the channel cannot be derived.
   */
  async broadcast(record: RecordedEvent, route: BroadcastRoute): Promise<void> {
    const channel = broadcastChannel(route, record);
    await this.fanout.publish({
      kind: "broadcast",
      broadcast: {
        permission: route.permission,
        message: { channel, name: route.name, id: record.meta.id },
      },
    });
  }
}

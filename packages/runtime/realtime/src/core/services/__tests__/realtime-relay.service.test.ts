/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeRelay`: `broadcast` fans a data-free refresh out under the derived channel; `start`
 *          hands fanned-out broadcasts to this instance's driver and room frames to its rooms, until stopped.
 * Boundary: test only; the local fanout, a recording driver and real rooms stand in for the network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1); ADR 0346 (decision 5).
 */
import { buildConfig } from "@stackra/config";
import { Realm } from "@stackra/contracts";
import { BroadcastAudience } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { RealtimeConfig } from "#config/realtime.config";
import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import type { RoomFrame } from "#contracts/types/room-frame.type";
import { LocalRealtimeFanoutDriver } from "#core/drivers/local-realtime-fanout.driver";
import { RealtimeRelay } from "#core/services/realtime-relay.service";
import { RealtimeRooms } from "#core/services/realtime-rooms.service";

class RecordingDriver extends RealtimeDriver {
  readonly published: RealtimeBroadcast[] = [];

  publish(broadcast: RealtimeBroadcast): Promise<number> {
    this.published.push(broadcast);
    return Promise.resolve(1);
  }
}

/** Lets queued microtasks run. */
const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe(RealtimeRelay, () => {
  it("fans broadcasts and room frames out to this instance", async () => {
    const fanout = new LocalRealtimeFanoutDriver();
    const driver = new RecordingDriver();
    const rooms = new RealtimeRooms(buildConfig(RealtimeConfig), fanout);
    const relay = new RealtimeRelay(fanout, driver, rooms);
    const stop = relay.start();
    await relay.broadcast(
      {
        event: {},
        meta: { id: "evt_1", occurredAt: new Date(), scopeId: "ten_1" },
      },
      {
        name: "orders.order.paid.v1",
        module: "orders",
        permission: "orders.order.read",
        audience: BroadcastAudience.Scope,
      },
    );
    const frames: RoomFrame[] = [];
    rooms.join(
      rooms.issueToken({
        session: { principalId: "usr_a", scopeId: "ten_1", realm: Realm.Staff, permissions: [] },
        document: "pag_1",
        mayEdit: true,
      }).token,
      { deliver: (frame) => frames.push(frame), close: () => undefined },
    );
    await fanout.publish({
      kind: "room",
      room: "ten_1:pag_1",
      frame: { t: "presence", from: { peerId: "p2", principalId: "usr_b" }, data: {} },
      origin: "elsewhere",
    });
    await settle();
    expect(driver.published).toEqual([
      {
        permission: "orders.order.read",
        message: { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" },
      },
    ]);
    expect(frames.map((frame) => frame.t)).toEqual(["welcome", "presence"]);
    stop();
    await relay.broadcast(
      { event: {}, meta: { id: "evt_2", occurredAt: new Date(), scopeId: "ten_1" } },
      {
        name: "orders.order.paid.v1",
        module: "orders",
        permission: "orders.order.read",
        audience: BroadcastAudience.Scope,
      },
    );
    await settle();
    expect(driver.published).toHaveLength(1);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `RealtimeFake`: a real `RealtimeConnection` that starts live (or at a given status), whose
 *          `emit` delivers the data-free refresh of the event to its subscribers without the payload, whose
 *          `setStatus` moves the status, whose `stop` signs it out, and whose `start` opens no network.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0225 (data-free refresh).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { RealtimeConnection, RealtimeStatus } from "#core/index";
import { RealtimeFake } from "#testing/realtime.fake";

class OrderPaid {
  static readonly eventName = "orders.order.paid.v1";

  orderId!: string;

  totalMinor!: number;
}

describe("RealtimeFake", () => {
  it("is a live connection by default, or at the status asked for", () => {
    const fake = new RealtimeFake();
    expect(fake).toBeInstanceOf(RealtimeConnection);
    expect(fake.state).toEqual({ status: RealtimeStatus.Connected });
    expect(new RealtimeFake(RealtimeStatus.Disconnected).state).toEqual({
      status: RealtimeStatus.Disconnected,
    });
  });

  it("emits the data-free refresh of an event to its subscribers", () => {
    const fake = new RealtimeFake();
    const listener = vi.fn();
    fake.subscribe(OrderPaid, listener);
    fake.emit(OrderPaid, { orderId: "ord_1", totalMinor: 100 });
    fake.emit(OrderPaid);
    expect(listener).toHaveBeenNthCalledWith(1, {
      channel: "test",
      name: "orders.order.paid.v1",
      id: "evt_fake_1",
    });
    expect(listener).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: "evt_fake_2" }));
    expect(JSON.stringify(listener.mock.calls)).not.toContain("ord_1");
  });

  it("moves the status and signs out on stop", () => {
    const fake = new RealtimeFake();
    fake.setStatus(RealtimeStatus.Connecting);
    expect(fake.state).toEqual({ status: RealtimeStatus.Connecting });
    fake.stop();
    expect(fake.state).toBeNull();
  });

  it("starts over the memory transport", async () => {
    const fake = new RealtimeFake();
    fake.start(() => "t1");
    expect(fake.state).toEqual({ status: RealtimeStatus.Connecting });
    for (let hop = 0; hop < 10; hop += 1) await Promise.resolve();
    expect(fake.state).toEqual({ status: RealtimeStatus.Connected });
  });
});

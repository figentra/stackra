/**
 * Stackra file contract:
 * Purpose: unit tests of the `memory` `RealtimeTransport`: a driver of the port whose links open on the next
 *          microtask, receive `emit`ted messages until closed, report nothing on a caller's close, and report `onClose`
 *          once on `drop`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it, vi } from "@stackra/testing";

import { RealtimeTransport } from "#contracts/ports/realtime-transport.port";
import { MemoryRealtimeTransportDriver } from "#core/drivers/memory-realtime-transport.driver";

const TARGET = { origin: "", token: "t1" };

const PAID = { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" };

/** Handlers that record their calls. */
const handlers = () => ({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn() });

describe("MemoryRealtimeTransportDriver", () => {
  it("is a driver of RealtimeTransport", () => {
    expect(new MemoryRealtimeTransportDriver()).toBeInstanceOf(RealtimeTransport);
    expect(kindOf(MemoryRealtimeTransportDriver)).toEqual({
      kind: "driver",
      options: { port: RealtimeTransport },
    });
  });

  it("opens on the next microtask and delivers emitted messages until closed", async () => {
    const transport = new MemoryRealtimeTransportDriver();
    const reported = handlers();
    const link = transport.open(TARGET, reported);
    expect(reported.onOpen).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(reported.onOpen).toHaveBeenCalledOnce();
    transport.emit(PAID);
    link.close();
    link.close();
    transport.emit(PAID);
    expect(reported.onMessage).toHaveBeenCalledExactlyOnceWith(PAID);
    expect(reported.onClose).not.toHaveBeenCalled();
    expect(transport.size).toBe(0);
  });

  it("never opens a link closed before its microtask", async () => {
    const transport = new MemoryRealtimeTransportDriver();
    const reported = handlers();
    transport.open(TARGET, reported).close();
    await Promise.resolve();
    expect(reported.onOpen).not.toHaveBeenCalled();
  });

  it("reports onClose once per open link on drop", () => {
    const transport = new MemoryRealtimeTransportDriver();
    const first = handlers();
    const second = handlers();
    transport.open(TARGET, first);
    transport.open(TARGET, second);
    transport.drop();
    transport.drop();
    expect(first.onClose).toHaveBeenCalledOnce();
    expect(second.onClose).toHaveBeenCalledOnce();
    expect(transport.size).toBe(0);
  });
});

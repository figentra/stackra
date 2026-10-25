/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `RealtimeDriver` port: a port a server driver implements, keyed so that
 *          `DriverName<RealtimeDriver>` is exactly this package's driver names (`sse`, `websocket`, `memory`).
 * Boundary: test only; the registry entry comes from this package's own augmentation, loaded through the core types.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 4).
 */
import type { DriverName } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import type { RealtimeDriverName } from "#core/types/realtime-driver-name.type";

describe("RealtimeDriver", () => {
  it("is a port a server driver implements", async () => {
    const published: RealtimeBroadcast[] = [];
    class RecordingDriver extends RealtimeDriver {
      publish(broadcast: RealtimeBroadcast): Promise<number> {
        published.push(broadcast);
        return Promise.resolve(1);
      }
    }
    const driver = new RecordingDriver();
    const broadcast: RealtimeBroadcast = {
      permission: "orders.order.read",
      message: { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" },
    };
    await expect(driver.publish(broadcast)).resolves.toBe(1);
    expect(driver).toBeInstanceOf(RealtimeDriver);
    expect(driver).toBeInstanceOf(Port);
    expect(published).toEqual([broadcast]);
  });

  it("narrows DriverName to this port's drivers", () => {
    expectTypeOf<DriverName<RealtimeDriver>>().toEqualTypeOf<RealtimeDriverName>();
    expectTypeOf<RealtimeDriverName>().toEqualTypeOf<"sse" | "websocket" | "memory">();
    const name: DriverName<RealtimeDriver> = "sse";
    // @ts-expect-error -- not a driver of this port
    const other: DriverName<RealtimeDriver> = "pusher";
    expect([name, other]).toEqual(["sse", "pusher"]);
  });
});

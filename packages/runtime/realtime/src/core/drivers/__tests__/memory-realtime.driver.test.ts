/**
 * Stackra file contract:
 * Purpose: unit tests of the `memory` `RealtimeDriver`: a driver of the port whose listeners join with a one-time
 *          token, receive what their session may receive, and stop receiving once they leave.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RealtimeConfig } from "#config/realtime.config";
import { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";
import { MemoryRealtimeDriver } from "#core/drivers/memory-realtime.driver";
import { RealtimeHub } from "#core/services/realtime-hub.service";

const PAID = {
  permission: "orders.order.read",
  message: { channel: "tenant.ten_1.orders", name: "orders.order.paid.v1", id: "evt_1" },
};

describe("MemoryRealtimeDriver", () => {
  it("is a driver of RealtimeDriver", () => {
    const driver = new MemoryRealtimeDriver(new RealtimeHub(buildConfig(RealtimeConfig)));
    expect(driver).toBeInstanceOf(RealtimeDriver);
    expect(kindOf(MemoryRealtimeDriver)).toEqual({
      kind: "driver",
      options: { port: RealtimeDriver },
    });
  });

  it("delivers to joined listeners until they leave", async () => {
    const hub = new RealtimeHub(buildConfig(RealtimeConfig));
    const driver = new MemoryRealtimeDriver(hub);
    const received: RealtimeMessage[] = [];
    const { token } = hub.issueToken({
      principalId: "usr_1",
      scopeId: "ten_1",
      realm: Realm.Staff,
      permissions: ["orders.order.read"],
    });
    const leave = driver.connect(token, (message) => received.push(message));
    expect(driver.connect(token, () => undefined)).toBeUndefined();
    await expect(driver.publish(PAID)).resolves.toBe(1);
    leave?.();
    await expect(driver.publish(PAID)).resolves.toBe(0);
    expect(received).toEqual([PAID.message]);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `DeviceAcknowledgedQuery`: the `device.acknowledged` query (no MCP tool, `GET
 *          /devices/acknowledged` by convention); with no input it answers the calling device's last acknowledged
 *          sequence or `null`, and refuses a call from no verified device; another device's sequence is answered only
 *          within the caller's scope (any for a platform caller).
 * Boundary: test only; the query is called directly with the memory sequence store of `@stackra/actions` and
 *           `fakeActionContext`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decisions 1 and 4).
 */
import { MemoryDeviceSequenceStoreDriver } from "@stackra/actions";
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeviceAcknowledgedQuery } from "#node/queries/device-acknowledged.query";
import { DeviceAcknowledgedInput } from "#node/schemas/device-acknowledged-input.schema";

const AT = new Date("2026-10-25T09:00:00.000Z");
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const SHOP: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme.shop_eu" };
const OTHER: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9", path: "platform.acmex" };

/** A call context in `scope`; a platform call without one. */
const as = (scope?: ScopeRef) => fakeActionContext(scope === undefined ? {} : { scope });

/** The query over a store where `dev_1` settled 1729760400000 in the shop and `dev_2` nothing. */
async function setup() {
  const store = new MemoryDeviceSequenceStoreDriver();
  await store.settle("dev_1", 1_729_760_400_000, AT, SHOP);
  return new DeviceAcknowledgedQuery(store);
}

describe("DeviceAcknowledgedQuery", () => {
  it("is the device.acknowledged query, not an MCP tool", () => {
    expect(kindOf(DeviceAcknowledgedQuery)?.options).toMatchObject({
      key: "device.acknowledged",
      tool: false,
    });
  });

  it("answers the calling device's last acknowledged sequence", async () => {
    const query = await setup();
    const own = DeviceAcknowledgedInput.create({});
    expect(await query.handle(own, fakeActionContext({ deviceId: "dev_1" }))).toMatchObject({
      sequence: 1_729_760_400_000,
    });
    expect(await query.handle(own, fakeActionContext({ deviceId: "dev_2" }))).toMatchObject({
      sequence: null,
    });
    await expect(query.handle(own, fakeActionContext())).rejects.toMatchObject({
      code: "input_invalid",
    });
  });

  it("answers another device's sequence only within the caller's scope", async () => {
    const query = await setup();
    const lost = DeviceAcknowledgedInput.create({ deviceId: "dev_1" });
    expect((await query.handle(lost, as(ACME))).sequence).toBe(1_729_760_400_000);
    expect((await query.handle(lost, as(SHOP))).sequence).toBe(1_729_760_400_000);
    expect((await query.handle(lost, as(OTHER))).sequence).toBeNull();
    expect((await query.handle(lost, as())).sequence).toBe(1_729_760_400_000);
  });
});

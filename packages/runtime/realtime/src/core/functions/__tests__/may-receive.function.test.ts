/**
 * Stackra file contract:
 * Purpose: unit tests of `mayReceive`: the permission is required everywhere, a principal channel reaches only its own
 *          principal (whatever the realm list), a tenant channel only the same tenant's sessions of an allowed realm,
 *          and any other channel shape reaches nobody.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0225 (decision 1; notes of 0294 and 2026-10-23).
 */
import { Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { RealtimeSession } from "#contracts/types/realtime-session.type";
import { mayReceive } from "#core/functions/may-receive.function";

const ALL = [Realm.Platform, Realm.Tenant, Realm.Customer];

const STAFF: RealtimeSession = {
  principalId: "usr_1",
  tenantId: "ten_1",
  realm: Realm.Tenant,
  permissions: ["orders.order.read", "messages.inbox_message.read"],
};

/** A broadcast on `channel` needing `permission`. */
function on(channel: string, permission = "orders.order.read") {
  return { permission, message: { channel, name: "orders.order.paid.v1", id: "evt_1" } };
}

/** A broadcast on `id`'s inbox channel. */
const inbox = (id: string) => on(`principal.${id}.messages`, "messages.inbox_message.read");

describe("mayReceive", () => {
  it("needs the permission", () => {
    expect(mayReceive(STAFF, on("tenant.ten_1.orders"), ALL)).toBe(true);
    expect(mayReceive(STAFF, on("tenant.ten_1.orders", "orders.order.refund"), ALL)).toBe(false);
  });

  it("reaches a principal channel's own principal only, whatever the realms", () => {
    expect(mayReceive(STAFF, inbox("usr_1"), [])).toBe(true);
    expect(mayReceive(STAFF, inbox("usr_2"), ALL)).toBe(false);
  });

  it("reaches a tenant channel's own tenant in an allowed realm only", () => {
    expect(mayReceive(STAFF, on("tenant.ten_2.orders"), ALL)).toBe(false);
    const customer: RealtimeSession = { ...STAFF, realm: Realm.Customer };
    expect(mayReceive(customer, on("tenant.ten_1.orders"), [Realm.Tenant])).toBe(false);
    expect(mayReceive(customer, on("tenant.ten_1.orders"), ALL)).toBe(true);
    const { realm: _realm, ...agent } = STAFF;
    expect(mayReceive(agent, on("tenant.ten_1.orders"), ALL)).toBe(false);
    const { tenantId: _tenant, ...platform } = STAFF;
    expect(mayReceive(platform, on("tenant.undefined.orders"), ALL)).toBe(false);
  });

  it("denies any other channel shape", () => {
    for (const channel of ["tenant.ten_1", "tenant.ten_1.orders.extra", "global.x.orders", ""])
      expect(mayReceive(STAFF, on(channel), ALL)).toBe(false);
  });
});

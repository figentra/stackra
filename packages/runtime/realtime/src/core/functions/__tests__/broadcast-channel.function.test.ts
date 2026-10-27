/**
 * Stackra file contract:
 * Purpose: unit tests of `broadcastChannel`: a tenant audience goes to the occurrence's tenant, a principal audience to
 *          the event's `principalId` or else the user the call acted for, and a channel it cannot fill throws instead
 *          of widening.
 * Boundary: test only; the records are plain objects of the `RecordedEvent` shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (amendment item 7); ADR 0225 (2026-10-23 note).
 */
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";
import { BroadcastAudience } from "@stackra/events";
import type { RecordedEvent } from "@stackra/events/contracts";
import { describe, expect, it } from "@stackra/testing";

import { broadcastChannel } from "#core/functions/broadcast-channel.function";
import type { BroadcastRoute } from "#core/types/broadcast-route.type";

const ORDER_PAID: BroadcastRoute = {
  name: "orders.order.paid.v1",
  module: "orders",
  permission: "orders.order.read",
  audience: BroadcastAudience.Scope,
};

const INBOX_CREATED: BroadcastRoute = {
  name: "messages.inbox_message.created.v1",
  module: "messages",
  permission: "messages.inbox_message.read",
  audience: BroadcastAudience.Principal,
};

const USER: Actor = { kind: ActorKind.User, id: "usr_1" as PublicId<"usr">, realm: Realm.Staff };

/** A recorded occurrence of `event` with `meta` over a fixed id and time. */
function record(event: object, meta: Partial<RecordedEvent["meta"]> = {}): RecordedEvent {
  return { event, meta: { id: "evt_1", occurredAt: new Date(0), ...meta } };
}

describe("broadcastChannel", () => {
  it("sends a tenant audience to the occurrence's tenant", () => {
    expect(broadcastChannel(ORDER_PAID, record({ orderId: "ord_1" }, { scopeId: "ten_1" }))).toBe(
      "tenant.ten_1.orders",
    );
  });

  it("sends a principal audience to the event's principalId first", () => {
    const occurrence = record({ principalId: "usr_9" }, { scopeId: "ten_1", actor: USER });
    expect(broadcastChannel(INBOX_CREATED, occurrence)).toBe("principal.usr_9.messages");
  });

  it("falls back to the user the call acted for", () => {
    expect(broadcastChannel(INBOX_CREATED, record({}, { actor: USER }))).toBe(
      "principal.usr_1.messages",
    );
    const agent: Actor = {
      kind: ActorKind.Agent,
      id: "agt_1" as PublicId,
      onBehalfOf: USER,
    };
    expect(broadcastChannel(INBOX_CREATED, record({}, { actor: agent }))).toBe(
      "principal.usr_1.messages",
    );
  });

  it("throws rather than widen when the id is missing or malformed", () => {
    expect(() => broadcastChannel(ORDER_PAID, record({}))).toThrow(TypeError);
    expect(() => broadcastChannel(INBOX_CREATED, record({}))).toThrow(TypeError);
    const service: Actor = { kind: ActorKind.Service, id: "svc_1" as PublicId };
    expect(() => broadcastChannel(INBOX_CREATED, record({}, { actor: service }))).toThrow(
      TypeError,
    );
    expect(() =>
      broadcastChannel(INBOX_CREATED, record({ principalId: "usr.1" }, { actor: USER })),
    ).toThrow(TypeError);
    expect(() =>
      broadcastChannel({ ...ORDER_PAID, module: "orders.x" }, record({}, { scopeId: "ten_1" })),
    ).toThrow(TypeError);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `eventMessage`: a recorded integration event becomes a due event message with its id, time,
 *          wire name, the event as payload and the rest of the metadata; a domain event and an id that is not an
 *          `evt_` id are refused; ids stored in the older ULID and random forms still pass (STA-1380).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141 (decisions 2 and 3).
 */
import { type Actor, ActorKind } from "@stackra/contracts";
import { DomainEvent, IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { MessageKind } from "#contracts/index";
import { eventMessage } from "#core/functions/event-message.function";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const ACTOR: Actor = { kind: ActorKind.Service, id: "svc_commerce" };

class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {}

class PointsRedeemed extends DomainEvent {}

describe(eventMessage, () => {
  it("builds a due event message from the occurrence", () => {
    const event = new OrderPaid();
    expect(
      eventMessage({
        event,
        meta: { id: "evt_A", occurredAt: NOON, actor: ACTOR, causationId: "evt_0" },
      }),
    ).toEqual({
      id: "evt_A",
      kind: MessageKind.Event,
      type: "order.paid.v1",
      data: event,
      meta: { actor: ACTOR, causationId: "evt_0" },
      occurredAt: NOON,
      attempts: 0,
      availableAt: NOON,
    });
  });

  it("keeps ids minted in the older forms", () => {
    // The ULID form the outbox minted and the random form actions minted before STA-1380.
    for (const id of ["evt_01JB6Z3Q0M4V9TBN1XG5RD2HC8", "evt_7zk3q0m4v9tbn1xg5rd2hc8wpa"])
      expect(eventMessage({ event: new OrderPaid(), meta: { id, occurredAt: NOON } }).id).toBe(id);
  });

  it("refuses a domain event and an id that is not an evt_ id", () => {
    expect(() =>
      eventMessage({ event: new PointsRedeemed(), meta: { id: "evt_A", occurredAt: NOON } }),
    ).toThrow(TypeError);
    expect(() =>
      eventMessage({ event: new OrderPaid(), meta: { id: "job_A", occurredAt: NOON } }),
    ).toThrow(/starts with evt_/);
  });
});

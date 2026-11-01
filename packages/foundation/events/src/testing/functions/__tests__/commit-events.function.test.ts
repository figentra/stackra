/**
 * Stackra file contract:
 * Purpose: unit tests of `commitEvents`: an integration event is written to the app's outbox, any other event is
 *          dispatched on its bus, both show in `app.events.published()` in order, and before any app compiled it does
 *          nothing (STA-1740); the committing call's actor, id and scope travel with an integration event, and
 *          `drainOutbox()` runs each delivery through the registered delivery scope with them (STA-1789).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0078 (decisions 3 and 4).
 */
import { Module } from "@stackra/container";
import { createTestingModule } from "@stackra/container/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { DomainEvent, IntegrationEvent } from "#core/index";
import "#testing/index";
import { DELIVERY_SCOPE } from "#testing/constants/delivery-scope.constant";
import { commitEvents } from "#testing/functions/commit-events.function";
import { deliverEventsIn } from "#testing/functions/deliver-events-in.function";
import { drainOutbox } from "#testing/functions/drain-outbox.function";
import { currentHarness } from "#testing/functions/current-harness.function";
import type { OutboxFake } from "#testing/outbox.fake";

class PaymentCaptured extends IntegrationEvent({ name: "payment.captured" }) {
  paymentId!: string;
}

class StockReserved extends DomainEvent {}

registerSchemas([[PaymentCaptured, z.object({ paymentId: z.string() })]]);

class FixtureModule extends Module {}

describe(commitEvents, () => {
  it("does nothing before an app compiled", async () => {
    await expect(commitEvents([new StockReserved()])).resolves.toBeUndefined();
  });

  it("writes an integration event to the outbox and dispatches any other on the bus", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    const captured = PaymentCaptured.create({ paymentId: "pay_1" });
    const reserved = new StockReserved();

    await commitEvents([captured, reserved]);

    const { bus, outbox } = currentHarness();
    expect((outbox as OutboxFake).written().map((record) => record.event)).toEqual([captured]);
    expect(bus.published().map((record) => record.event)).toEqual([reserved]);
    expect([...app.events.published()]).toEqual(expect.arrayContaining([captured, reserved]));
    expect(app.events.published()).toHaveLength(2);
  });
});

describe("commitEvents and drainOutbox in the committing call's scope (STA-1789)", () => {
  afterEach(() => {
    DELIVERY_SCOPE.value = undefined;
  });

  const call = {
    actor: {
      kind: "user",
      id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
      scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
    },
    callId: "call-1",
    scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa", path: "platform.acme" },
  } as const;

  it("writes the call's actor, id and scope with an integration event", async () => {
    await createTestingModule(FixtureModule).compile();
    await commitEvents([PaymentCaptured.create({ paymentId: "pay_2" })], call as never);
    const { outbox, scopes } = currentHarness();
    const [record] = (outbox as OutboxFake).written();
    expect(record?.meta).toMatchObject({
      actor: call.actor,
      correlationId: "call-1",
      scopeId: call.scope.id,
    });
    expect(scopes.get(record?.meta.id ?? "")).toEqual(call.scope);
  });

  it("drains each event on its own through the delivery scope, with its meta and scope", async () => {
    await createTestingModule(FixtureModule).compile();
    const seen: { readonly id: string | undefined; readonly scope: unknown }[] = [];
    deliverEventsIn(async (_app, meta, scope, work) => {
      seen.push({ id: meta.id, scope });
      return work();
    });
    await commitEvents(
      [
        PaymentCaptured.create({ paymentId: "pay_3" }),
        PaymentCaptured.create({ paymentId: "pay_4" }),
      ],
      call as never,
    );
    await commitEvents([PaymentCaptured.create({ paymentId: "pay_5" })]);
    await drainOutbox();
    expect(seen.map((entry) => entry.scope)).toEqual([call.scope, call.scope, undefined]);
    expect(new Set(seen.map((entry) => entry.id)).size).toBe(3);
  });

  it("delivers as before when no delivery scope is registered", async () => {
    await createTestingModule(FixtureModule).compile();
    await commitEvents([PaymentCaptured.create({ paymentId: "pay_6" })], call as never);
    await expect(drainOutbox()).resolves.toEqual([]);
  });
});

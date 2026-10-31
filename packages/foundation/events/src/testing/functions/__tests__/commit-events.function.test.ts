/**
 * Stackra file contract:
 * Purpose: unit tests of `commitEvents`: an integration event is written to the app's outbox, any other event is
 *          dispatched on its bus, both show in `app.events.published()` in order, and before any app compiled it does
 *          nothing (STA-1740).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0078 (decisions 3 and 4).
 */
import { Module } from "@stackra/container";
import { createTestingModule } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { DomainEvent, IntegrationEvent } from "#core/index";
import "#testing/index";
import { commitEvents } from "#testing/functions/commit-events.function";
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

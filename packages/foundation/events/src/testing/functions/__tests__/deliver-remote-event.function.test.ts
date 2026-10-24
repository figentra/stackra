/**
 * Stackra file contract:
 * Purpose: unit tests of `deliverRemoteEvent`: it builds the event through its schema, puts it in the current app's
 *          inbox with its metadata (no listener runs until `drainOutbox`), never counts it as published by this app,
 *          and refuses fields its schema refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0260 (decision 3).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { IntegrationEvent } from "#core/index";
import "#testing/index";
import { currentHarness } from "#testing/functions/current-harness.function";
import { deliverRemoteEvent } from "#testing/functions/deliver-remote-event.function";

class PaymentCaptured extends IntegrationEvent({ name: "payment.captured" }) {
  paymentId!: string;

  reference!: string;
}

registerSchemas([
  [PaymentCaptured, z.object({ paymentId: z.string().startsWith("pay_"), reference: z.string() })],
]);

class FixtureModule extends Module {}

registerWiring({ member: "fixture", root: FixtureModule });

describe(deliverRemoteEvent, () => {
  it("builds the event and puts it in the inbox with its metadata", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    const event = await deliverRemoteEvent(
      PaymentCaptured,
      { paymentId: "pay_1", reference: "ord_1" },
      { id: "evt_1", connection: "con_1" },
    );

    expect(event).toBeInstanceOf(PaymentCaptured);
    expect(event.reference).toBe("ord_1");
    expect(currentHarness().inbox).toEqual([{ event, meta: { id: "evt_1", connection: "con_1" } }]);
    expect(app.events.published()).toEqual([]);
  });

  it("refuses fields the schema refuses", async () => {
    await createTestingModule(FixtureModule).compile();
    await expect(
      deliverRemoteEvent(PaymentCaptured, { paymentId: "gft_1", reference: "ord_1" }),
    ).rejects.toThrow();
    expect(currentHarness().inbox).toEqual([]);
  });
});

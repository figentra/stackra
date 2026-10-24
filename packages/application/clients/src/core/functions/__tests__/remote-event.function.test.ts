/**
 * Stackra file contract:
 * Purpose: unit and type tests of `remoteEvent`: a service's event class carries the wire name and payload schema and is
 *          typed by the payload, as a listener's parameter.
 * Boundary: test only; the event restates the template's generated `services/commerce` payments client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0141 (wire names); ADR 0260 (decision 4).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { remoteEvent } from "#core/functions/remote-event.function";

const payload = z.object({ paymentId: z.string(), reference: z.string() });

class PaymentCaptured extends remoteEvent("payments.payment.captured.v1", payload) {}

describe("remoteEvent", () => {
  it("carries the wire name and the payload schema", () => {
    expect(PaymentCaptured.eventName).toBe("payments.payment.captured.v1");
    expect(PaymentCaptured.payload).toBe(payload);
  });

  it("is typed by its payload", () => {
    expectTypeOf<PaymentCaptured>().toEqualTypeOf<{ paymentId: string; reference: string }>();
  });
});

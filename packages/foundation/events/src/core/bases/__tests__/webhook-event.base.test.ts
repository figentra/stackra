/**
 * Stackra file contract:
 * Purpose: unit and type tests of `WebhookEvent<I>`: called with the Integration as a type argument; the provider's
 *          type is recorded as the `webhook_event` kind; an empty type is refused; the class carries the partner as a
 *          type-only member and is an `Event`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 15); ADR 0305 (rules 42 to 46).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Event } from "#core/bases/event.base";
import { WebhookEvent } from "#core/bases/webhook-event.base";
import type { WebhookEventClass } from "#core/types/webhook-event-class.type";

class ResendIntegration {
  readonly provider = "resend";
}

class InboundMailReceived extends WebhookEvent<ResendIntegration>({ type: "email.received" }) {
  created_at!: Date;
}

describe("WebhookEvent", () => {
  it("records the provider's event type", () => {
    expect(kindOf(InboundMailReceived)).toEqual({
      kind: "webhook_event",
      options: { type: "email.received" },
    });
  });

  it("refuses an empty or missing type", () => {
    expect(() => WebhookEvent({ type: "" })).toThrow(TypeError);
    expect(() => WebhookEvent(undefined as never)).toThrow(TypeError);
  });

  it("is an Event class carrying its Integration as a type", () => {
    expect(InboundMailReceived.prototype).toBeInstanceOf(Event);
    expect("~integration" in InboundMailReceived).toBe(false);
    expectTypeOf(WebhookEvent<ResendIntegration>({ type: "x" })).toEqualTypeOf<
      WebhookEventClass<ResendIntegration>
    >();
  });
});

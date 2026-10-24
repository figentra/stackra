/**
 * Stackra file contract:
 * Purpose: unit tests of `AnalyticsFake`, in the template tests' shapes: a real `AnalyticsClient` that records every
 *          tracked event (`events()` and `tracked`, equal to `X.create(...)`), reads `pending`, `opted_in` and
 *          `opted_out` from its own consent ledger, delivers only what consent let through, records nothing a refused
 *          track threw on, and never shares state with another fake.
 * Boundary: test only; registers each event's zod schema the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0298 (decisions 1 and 5).
 */
import { ConsentCategory, ConsentLedger } from "@stackra/consent";
import { AnalyticsEvent, DomainEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { AnalyticsClient } from "#core/index";
import { AnalyticsFake } from "#testing/analytics.fake";

/** The template's contact-page event. */
class LeadSubmitted extends AnalyticsEvent({ name: "lead.submitted" }) {
  plan!: string;
}

/** A domain event, which `track` refuses. */
class OrderPaid extends DomainEvent {
  orderId!: string;
}

registerSchemas([
  [LeadSubmitted, z.object({ plan: z.string() })],
  [OrderPaid, z.object({ orderId: z.string() })],
]);

describe("AnalyticsFake", () => {
  it("is a real client with its own consent ledger, nothing decided", () => {
    const analytics = new AnalyticsFake();
    expect(analytics).toBeInstanceOf(AnalyticsClient);
    expect(analytics.consent).toBeInstanceOf(ConsentLedger);
    expect(analytics.state).toBe("pending");
  });

  it("records every tracked event, as the contact and scan tests read them", () => {
    const analytics = new AnalyticsFake();
    analytics.track(LeadSubmitted.create({ plan: "enterprise" }));
    expect(analytics.events()).toEqual([LeadSubmitted.create({ plan: "enterprise" })]);
    expect(analytics.tracked).toEqual([LeadSubmitted.create({ plan: "enterprise" })]);
  });

  it("reads the banner's decision from its ledger", () => {
    const declined = new AnalyticsFake();
    declined.consent.set(ConsentCategory.Analytics, false);
    expect(declined.state).toBe("opted_out");
    const allowed = new AnalyticsFake();
    allowed.consent.set(ConsentCategory.Analytics, true);
    expect(allowed.state).toBe("opted_in");
  });

  it("delivers only what consent let through", () => {
    const analytics = new AnalyticsFake();
    analytics.track(LeadSubmitted.create({ plan: "pro" }));
    expect(analytics.delivered()).toEqual([]);
    analytics.consent.set(ConsentCategory.Analytics, true);
    expect(analytics.delivered()).toEqual([
      expect.objectContaining({ name: "lead.submitted", properties: { plan: "pro" } }),
    ]);
    const refused = new AnalyticsFake();
    refused.track(LeadSubmitted.create({ plan: "pro" }));
    refused.consent.set(ConsentCategory.Analytics, false);
    expect(refused.delivered()).toEqual([]);
    expect(refused.events()).toHaveLength(1);
  });

  it("records nothing for an event track refuses", () => {
    const analytics = new AnalyticsFake();
    expect(() => analytics.track(OrderPaid.create({ orderId: "ord_1" }))).toThrow(TypeError);
    expect(analytics.events()).toEqual([]);
  });

  it("never shares state between fakes", () => {
    const first = new AnalyticsFake();
    first.consent.set(ConsentCategory.Analytics, true);
    first.track(LeadSubmitted.create({ plan: "pro" }));
    const second = new AnalyticsFake();
    expect(second.state).toBe("pending");
    expect(second.events()).toEqual([]);
    expect(second.delivered()).toEqual([]);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `AnalyticsClient`, the ADR 0298 enforcement list: nothing is sent before a decision, the
 *          queue is sent in order on acceptance with each event's capture time, discarded unsent on refusal, holds at
 *          most `queueLimit` events (keeping the earliest), and Global Privacy Control counts as a refusal; plus the
 *          payload rules (declared fields only, the deny list removed), the refusal of a non-analytics event, a
 *          driver failure kept from the caller, the ledger watched only while events wait, and the envelope v2 ids
 *          and context (event id per event, visitor and session ids made only after consent and kept for the launch).
 * Boundary: test only; registers each event's zod schema the way gen does; the memory driver records what left.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298 (decisions 1, 2 and 5); ADR 0305 (rule 20).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import {
  ConsentCategory,
  ConsentConfig,
  ConsentLedger,
  MemoryConsentStoreDriver,
} from "@stackra/consent";
import { Driver } from "@stackra/container";
import { AnalyticsEvent, DomainEvent } from "@stackra/events";
import { afterEach, describe, expect, freezeClock, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { AnalyticsState } from "#core/enums/analytics-state.enum";
import { AnalyticsClient } from "#core/services/analytics-client.service";
import { MemoryAnalyticsDriver } from "#core/drivers/memory-analytics.driver";

/** The template's contact-page event. */
class LeadSubmitted extends AnalyticsEvent({ name: "lead.submitted" }) {
  plan!: string;
}

/** An event whose schema declares a contact field the deny list removes. */
class NewsletterJoined extends AnalyticsEvent({ name: "newsletter.joined" }) {
  source!: string;

  email!: string;
}

/** A domain event, which is never delivered as analytics. */
class OrderPaid extends DomainEvent {
  orderId!: string;
}

registerSchemas([
  [LeadSubmitted, z.object({ plan: z.string() })],
  [NewsletterJoined, z.object({ source: z.string(), email: z.string() })],
  [OrderPaid, z.object({ orderId: z.string() })],
]);

/** A driver whose sends always fail. */
class FailingAnalyticsDriver extends Driver(AnalyticsDriver) {
  send(): Promise<void> {
    return Promise.reject(new Error("provider down"));
  }
}

/** A client over a fresh ledger with nothing decided and the memory driver, with `values` layered on the config. */
function setUp(values: Partial<ConfigValues<AnalyticsConfig>> = {}) {
  const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
  const driver = new MemoryAnalyticsDriver();
  const client = new AnalyticsClient(buildConfig(AnalyticsConfig, { values }), driver, ledger);
  return { client, driver, ledger };
}

/** The names that reached the driver, in order. */
function sentNames(driver: MemoryAnalyticsDriver): string[] {
  return driver.delivered().map((delivery) => delivery.name);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AnalyticsClient", () => {
  it("sends nothing before a decision and reads as pending", () => {
    const { client, driver } = setUp();
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(client.state).toBe(AnalyticsState.Pending);
    expect(driver.delivered()).toEqual([]);
  });

  it("sends the queue in order on acceptance, each event with its capture time", () => {
    const { client, driver, ledger } = setUp();
    freezeClock("2026-10-24T09:00:00Z");
    client.track(LeadSubmitted.create({ plan: "pro" }));
    freezeClock("2026-10-24T09:00:05Z");
    client.track(NewsletterJoined.create({ source: "footer", email: "lina@acme.example" }));
    freezeClock("2026-10-24T09:01:00Z");
    ledger.set(ConsentCategory.Analytics, true);
    expect(driver.delivered()).toMatchObject([
      {
        name: "lead.submitted",
        properties: { plan: "pro" },
        occurredAt: "2026-10-24T09:00:00.000Z",
      },
      {
        name: "newsletter.joined",
        properties: { source: "footer", email: "lina@acme.example" },
        occurredAt: "2026-10-24T09:00:05.000Z",
      },
    ]);
    expect(client.state).toBe(AnalyticsState.OptedIn);
  });

  it("sends at once once the category is granted", () => {
    const { client, driver, ledger } = setUp();
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "team" }));
    expect(sentNames(driver)).toEqual(["lead.submitted"]);
  });

  it("discards the queue unsent on refusal and drops every later event", () => {
    const { client, driver, ledger } = setUp();
    client.track(LeadSubmitted.create({ plan: "pro" }));
    ledger.set(ConsentCategory.Analytics, false);
    client.track(LeadSubmitted.create({ plan: "team" }));
    expect(client.state).toBe(AnalyticsState.OptedOut);
    ledger.set(ConsentCategory.Analytics, true);
    expect(driver.delivered()).toEqual([]);
  });

  it("holds at most queueLimit events, keeping the earliest", () => {
    const { client, driver, ledger } = setUp({ queueLimit: 2 });
    for (const plan of ["first", "second", "third"]) client.track(LeadSubmitted.create({ plan }));
    ledger.set(ConsentCategory.Analytics, true);
    expect(driver.delivered().map((delivery) => delivery.properties.plan)).toEqual([
      "first",
      "second",
    ]);
  });

  it("queues nothing with a bound of zero", () => {
    const { client, driver, ledger } = setUp({ queueLimit: 0 });
    client.track(LeadSubmitted.create({ plan: "pro" }));
    ledger.set(ConsentCategory.Analytics, true);
    expect(driver.delivered()).toEqual([]);
  });

  it("treats Global Privacy Control as a refusal, even after an acceptance", () => {
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    const { client, driver, ledger } = setUp();
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(client.state).toBe(AnalyticsState.OptedOut);
    expect(driver.delivered()).toEqual([]);
  });

  it("follows the configured consent category", () => {
    const { client, driver, ledger } = setUp({ consentCategory: ConsentCategory.CrashReplay });
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(driver.delivered()).toEqual([]);
    ledger.set(ConsentCategory.CrashReplay, true);
    expect(sentNames(driver)).toEqual(["lead.submitted"]);
  });

  it("removes the deny list's properties before an event leaves", () => {
    const { client, driver, ledger } = setUp({ denyProperties: ["email", "phone"] });
    ledger.set(ConsentCategory.Analytics, true);
    client.track(NewsletterJoined.create({ source: "footer", email: "lina@acme.example" }));
    expect(driver.delivered()[0]?.properties).toEqual({ source: "footer" });
  });

  it("sends only the fields the event's schema declares", () => {
    const { client, driver, ledger } = setUp();
    ledger.set(ConsentCategory.Analytics, true);
    const event = Object.assign(Object.create(LeadSubmitted.prototype) as LeadSubmitted, {
      plan: "pro",
      phone: "+971500000000",
    });
    client.track(event);
    expect(driver.delivered()[0]?.properties).toEqual({ plan: "pro" });
  });

  it("refuses an event that is not an analytics event", () => {
    const { client } = setUp();
    expect(() => client.track(OrderPaid.create({ orderId: "ord_1" }))).toThrow(TypeError);
  });

  it("keeps a driver failure from the caller", async () => {
    const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
    ledger.set(ConsentCategory.Analytics, true);
    const client = new AnalyticsClient(
      buildConfig(AnalyticsConfig),
      new FailingAnalyticsDriver(),
      ledger,
    );
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    expect(() => client.track(LeadSubmitted.create({ plan: "pro" }))).not.toThrow();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it("gives each event its own id and the launch one visitor and one session", () => {
    const { client, driver, ledger } = setUp();
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    client.track(LeadSubmitted.create({ plan: "team" }));
    const [first, second] = driver.delivered();
    expect(first?.eventId).toMatch(/^evt_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(first?.eventId).not.toBe(second?.eventId);
    expect(first?.anonymousId).toMatch(/^anon_/);
    expect(first?.sessionId).toMatch(/^ses_/);
    expect(second?.anonymousId).toBe(first?.anonymousId);
    expect(second?.sessionId).toBe(first?.sessionId);
    expect(first).not.toHaveProperty("userId");
  });

  it("makes no visitor id for a visitor who refused", () => {
    const { client, ledger } = setUp();
    client.track(LeadSubmitted.create({ plan: "pro" }));
    ledger.set(ConsentCategory.Analytics, false);
    expect(Reflect.get(client, "anonymousId")).toBeNull();
    expect(Reflect.get(client, "sessionId")).toBeNull();
  });

  it("captures the library, page path and locale when the platform has them", () => {
    vi.stubGlobal("location", { pathname: "/pricing", search: "?email=lina@acme.example" });
    vi.stubGlobal("navigator", { language: "ar-SA" });
    const { client, driver, ledger } = setUp();
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(driver.delivered()[0]?.context).toEqual({
      library: { name: "@stackra/analytics" },
      page: { path: "/pricing" },
      locale: "ar-SA",
    });
  });

  it("captures only the library without a page or a locale", () => {
    vi.stubGlobal("location", undefined);
    vi.stubGlobal("navigator", undefined);
    const { client, driver, ledger } = setUp();
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(driver.delivered()[0]?.context).toEqual({ library: { name: "@stackra/analytics" } });
  });

  it("watches the ledger only while events wait", () => {
    const { client, ledger } = setUp();
    const subscribe = ledger.subscribe;
    let watching = 0;
    vi.spyOn(ledger, "subscribe").mockImplementation((listener) => {
      watching += 1;
      const stop = subscribe(listener);
      return () => {
        watching -= 1;
        stop();
      };
    });
    client.track(LeadSubmitted.create({ plan: "pro" }));
    client.track(LeadSubmitted.create({ plan: "team" }));
    expect(watching).toBe(1);
    ledger.set(ConsentCategory.Analytics, true);
    expect(watching).toBe(0);
  });
});

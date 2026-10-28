/**
 * Stackra file contract:
 * Purpose: unit tests of `AnalyticsClient`, the ADR 0298 enforcement list: nothing is sent before a decision, the
 *          queue is sent in order on acceptance with each event's capture time, discarded unsent on refusal, holds at
 *          most `queueLimit` events (keeping the earliest), and Global Privacy Control counts as a refusal; plus the
 *          payload rules (declared fields only, the deny list removed), the refusal of a non-analytics event, a
 *          driver failure kept from the caller, the ledger watched only while events wait or an identity is kept, the
 *          envelope v2 ids and context (event id per event, visitor and session ids made only after consent and kept
 *          for the launch), and identity stitching (identify, group, reset, the anonymous id kept only after consent,
 *          restored on a new launch and forgotten on withdrawal), and the delivery engine (batch at `flushAt`, the flush
 *          window, `flush()`, retry with backoff holding later events, the offline queue after spent retries, sampling
 *          per visitor and per event, the beacon on page hide, and the refusal dropping both), and the destinations
 *          (each gated by its own category, include and exclude routing, shared ids, the identity kept only under
 *          `consentCategory`, an unknown instance refused).
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
import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { AnalyticsDriverLookup } from "#contracts/ports/analytics-driver-lookup.port";
import type { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import type { AnalyticsIdentityRecord } from "#contracts/types/analytics-identity-record.type";
import { AnalyticsState } from "#core/enums/analytics-state.enum";
import { AnalyticsClient } from "#core/services/analytics-client.service";
import { MemoryAnalyticsDriver } from "#core/drivers/memory-analytics.driver";
import { MemoryAnalyticsIdentityDriver } from "#core/drivers/memory-analytics-identity.driver";
import { MemoryAnalyticsOfflineQueueDriver } from "#core/drivers/memory-analytics-offline-queue.driver";

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

/** The engine settings of the tests that read deliveries at once: one per batch, no window, no retry. */
const SEND_AT_ONCE = { flushAt: 1, flushIntervalMs: 0, retryAttempts: 0 } as const;

/** A client over a fresh ledger with nothing decided and the memory driver, with `values` layered on the config. */
function setUp(values: Partial<ConfigValues<AnalyticsConfig>> = {}) {
  const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
  const driver = new MemoryAnalyticsDriver();
  const client = new AnalyticsClient(
    buildConfig(AnalyticsConfig, { values: { ...SEND_AT_ONCE, ...values } }),
    driver,
    ledger,
  );
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
      buildConfig(AnalyticsConfig, { values: SEND_AT_ONCE }),
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

  it("watches the ledger while events wait, then only while it keeps an identity", () => {
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
    // The queue's watch ends; the identity guard starts, so a later refusal forgets the visitor.
    expect(watching).toBe(1);
    ledger.set(ConsentCategory.Analytics, false);
    expect(watching).toBe(0);
  });
});

/** A client with a memory identity store the test reads. */
function withIdentity(kept: AnalyticsIdentityRecord | null = null) {
  const identity = new MemoryAnalyticsIdentityDriver();
  if (kept !== null) identity.write(kept);
  const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
  const driver = new MemoryAnalyticsDriver();
  const client = new AnalyticsClient(
    buildConfig(AnalyticsConfig, { values: SEND_AT_ONCE }),
    driver,
    ledger,
    identity,
  );
  return { client, driver, ledger, identity };
}

describe("AnalyticsClient identity (stackra-405)", () => {
  it("keeps nothing before consent and the anonymous id once granted", () => {
    const { client, ledger, identity, driver } = withIdentity();
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(identity.read()).toBeNull();
    ledger.set(ConsentCategory.Analytics, true);
    expect(identity.read()).toEqual({ anonymousId: driver.delivered()[0]?.anonymousId });
  });

  it("restores the kept anonymous id on a new launch", () => {
    const { client, ledger, driver } = withIdentity({ anonymousId: "anon_kept" });
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(driver.delivered()[0]?.anonymousId).toBe("anon_kept");
  });

  it("never reads the kept id while undecided or refused", () => {
    const { client, ledger, driver, identity } = withIdentity({ anonymousId: "anon_kept" });
    ledger.set(ConsentCategory.Analytics, false);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(driver.delivered()).toEqual([]);
    expect(identity.read()).toBeNull();
  });

  it("identifies: an identify delivery, then events as the user, kept with the anonymous id", () => {
    const { client, ledger, driver, identity } = withIdentity();
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    client.identify("usr_1");
    client.identify("usr_1");
    client.track(LeadSubmitted.create({ plan: "team" }));
    const [before, link, after] = driver.delivered();
    expect(driver.delivered()).toHaveLength(3);
    expect(before?.userId).toBeUndefined();
    expect(link).toMatchObject({
      kind: AnalyticsDeliveryKind.Identify,
      name: "identify",
      userId: "usr_1",
    });
    expect(link?.anonymousId).toBe(before?.anonymousId);
    expect(after).toMatchObject({ kind: AnalyticsDeliveryKind.Track, userId: "usr_1" });
    expect(identity.read()).toEqual({ anonymousId: before?.anonymousId, userId: "usr_1" });
  });

  it("queues identify and group with the events until the visitor decides", () => {
    const { client, ledger, driver } = withIdentity();
    client.identify("usr_1");
    client.group("scope", "scp_1");
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(driver.delivered()).toEqual([]);
    ledger.set(ConsentCategory.Analytics, true);
    expect(driver.delivered().map((delivery) => delivery.kind)).toEqual([
      AnalyticsDeliveryKind.Identify,
      AnalyticsDeliveryKind.Group,
      AnalyticsDeliveryKind.Track,
    ]);
    expect(driver.delivered()[1]).toMatchObject({
      properties: { type: "scope", id: "scp_1" },
      groups: { scope: "scp_1" },
    });
    expect(driver.delivered()[2]?.groups).toEqual({ scope: "scp_1" });
  });

  it("replaces a group of the same type and ignores a repeat", () => {
    const { client, ledger, driver } = withIdentity();
    ledger.set(ConsentCategory.Analytics, true);
    client.group("scope", "scp_1");
    client.group("scope", "scp_1");
    client.group("scope", "scp_2");
    expect(driver.delivered()).toHaveLength(2);
    expect(driver.delivered()[1]?.groups).toEqual({ scope: "scp_2" });
  });

  it("resets on sign-out: a new anonymous visitor and session, no user, nothing kept", () => {
    const { client, ledger, driver, identity } = withIdentity();
    ledger.set(ConsentCategory.Analytics, true);
    client.identify("usr_1");
    client.group("scope", "scp_1");
    const first = driver.delivered()[0];
    client.reset();
    expect(identity.read()).toBeNull();
    client.track(LeadSubmitted.create({ plan: "pro" }));
    const after = driver.delivered().at(-1);
    expect(after?.anonymousId).not.toBe(first?.anonymousId);
    expect(after?.sessionId).not.toBe(first?.sessionId);
    expect(after?.userId).toBeUndefined();
    expect(after?.groups).toBeUndefined();
  });

  it("forgets the kept identity as soon as consent is withdrawn", () => {
    const { client, ledger, identity } = withIdentity();
    ledger.set(ConsentCategory.Analytics, true);
    client.identify("usr_1");
    expect(identity.read()).not.toBeNull();
    ledger.set(ConsentCategory.Analytics, false);
    expect(identity.read()).toBeNull();
  });

  it("refuses an empty user id or group", () => {
    const { client } = withIdentity();
    expect(() => client.identify("")).toThrow(RangeError);
    expect(() => client.group("", "scp_1")).toThrow(RangeError);
    expect(() => client.group("scope", "")).toThrow(RangeError);
  });
});

/** A driver that records each batch, fails the first `failing` sends, and takes beacons when `beacons` is set. */
class BatchRecordingDriver extends Driver(AnalyticsDriver) {
  readonly batches: string[][] = [];

  readonly beaconed: string[][] = [];

  failing: number;

  private readonly beacons: boolean;

  /**
   * @param failing - how many sends reject before they succeed.
   * @param beacons - whether `beacon` takes a batch.
   */
  constructor(failing = 0, beacons = false) {
    super();
    this.failing = failing;
    this.beacons = beacons;
  }

  /** Records `deliveries` by name, or rejects while failures remain. */
  send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    if (this.failing > 0) {
      this.failing -= 1;
      return Promise.reject(new Error("provider down"));
    }
    this.batches.push(
      deliveries.map((delivery) => String(delivery.properties.plan ?? delivery.name)),
    );
    return Promise.resolve();
  }

  /** Records a beacon when allowed. */
  override beacon(deliveries: readonly AnalyticsDelivery[]): boolean {
    if (!this.beacons) return false;
    this.beaconed.push(deliveries.map((delivery) => String(delivery.properties.plan)));
    return true;
  }
}

/** A granted client over `driver` with the engine settings `values` and `offline` as the offline queue. */
function engineWith(
  driver: AnalyticsDriver,
  values: Partial<ConfigValues<AnalyticsConfig>> = {},
  offline?: AnalyticsOfflineQueue,
) {
  const config = buildConfig(AnalyticsConfig, { values });
  const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
  ledger.set(ConsentCategory.Analytics, true);
  const client = new AnalyticsClient(
    config,
    driver,
    ledger,
    new MemoryAnalyticsIdentityDriver(),
    offline ?? new MemoryAnalyticsOfflineQueueDriver(config),
  );
  return { client, ledger, config };
}

/** Tracks one lead per plan. */
function trackPlans(client: AnalyticsClient, ...plans: string[]): void {
  for (const plan of plans) client.track(LeadSubmitted.create({ plan }));
}

describe("AnalyticsClient delivery engine (stackra-406)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends one batch once flushAt deliveries wait", () => {
    const driver = new BatchRecordingDriver();
    const { client } = engineWith(driver, { flushAt: 3, flushIntervalMs: 10_000 });
    trackPlans(client, "a", "b");
    expect(driver.batches).toEqual([]);
    trackPlans(client, "c");
    expect(driver.batches).toEqual([["a", "b", "c"]]);
  });

  it("sends what waits once the flush window passes", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const driver = new BatchRecordingDriver();
    const { client } = engineWith(driver, { flushAt: 20, flushIntervalMs: 5000 });
    trackPlans(client, "a", "b");
    await vi.advanceTimersByTimeAsync(4999);
    expect(driver.batches).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(driver.batches).toEqual([["a", "b"]]);
  });

  it("sends at once on flush()", async () => {
    const driver = new BatchRecordingDriver();
    const { client } = engineWith(driver, { flushAt: 20, flushIntervalMs: 60_000 });
    trackPlans(client, "a");
    await client.flush();
    expect(driver.batches).toEqual([["a"]]);
  });

  it("retries a failed batch with backoff, holding new events until it goes, in order", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const driver = new BatchRecordingDriver(2);
    const { client } = engineWith(driver, {
      flushAt: 1,
      flushIntervalMs: 0,
      retryAttempts: 3,
      retryBaseMs: 1000,
      retryMaxMs: 30_000,
    });
    trackPlans(client, "a");
    await vi.advanceTimersByTimeAsync(0);
    trackPlans(client, "b");
    expect(driver.batches).toEqual([]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(driver.batches).toEqual([]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(driver.batches).toEqual([["a", "b"]]);
  });

  it("keeps a batch offline once its retries are spent, and sends it first on the next launch", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const config = buildConfig(AnalyticsConfig);
    const offline = new MemoryAnalyticsOfflineQueueDriver(config);
    const failing = new BatchRecordingDriver(10);
    const first = engineWith(failing, { flushAt: 1, retryAttempts: 1, retryBaseMs: 100 }, offline);
    trackPlans(first.client, "a");
    await vi.advanceTimersByTimeAsync(1000);
    expect(offline.load().map((delivery) => delivery.properties.plan)).toEqual(["a"]);
    const working = new BatchRecordingDriver();
    const second = engineWith(working, { flushAt: 1, flushIntervalMs: 0 }, offline);
    trackPlans(second.client, "b");
    expect(working.batches).toEqual([["a", "b"]]);
    expect(offline.load()).toEqual([]);
  });

  it("samples per visitor: a zero rate sends no event but still sends identify", () => {
    const driver = new BatchRecordingDriver();
    const { client } = engineWith(driver, { flushAt: 1, flushIntervalMs: 0, sampleRate: 0 });
    trackPlans(client, "a");
    client.identify("usr_1");
    expect(driver.batches).toEqual([["identify"]]);
  });

  it("lets an event's own rate replace the global one", () => {
    const driver = new BatchRecordingDriver();
    const { client } = engineWith(driver, {
      flushAt: 1,
      flushIntervalMs: 0,
      sampleRate: 0,
      sampleRates: { "lead.submitted": 1 },
    });
    trackPlans(client, "a");
    client.track(NewsletterJoined.create({ source: "footer", email: "lina@acme.example" }));
    expect(driver.batches).toEqual([["a"]]);
  });

  it("hands the buffer to the beacon when the page hides, else sends it", () => {
    const listeners = new Map<string, () => void>();
    vi.stubGlobal("addEventListener", (type: string, listener: () => void) => {
      listeners.set(type, listener);
    });
    const beaconing = new BatchRecordingDriver(0, true);
    const one = engineWith(beaconing, { flushAt: 20, flushIntervalMs: 60_000 });
    trackPlans(one.client, "a", "b");
    listeners.get("pagehide")?.();
    expect(beaconing.beaconed).toEqual([["a", "b"]]);
    expect(beaconing.batches).toEqual([]);

    const plain = new BatchRecordingDriver();
    const two = engineWith(plain, { flushAt: 20, flushIntervalMs: 60_000 });
    trackPlans(two.client, "c");
    listeners.get("pagehide")?.();
    expect(plain.batches).toEqual([["c"]]);
  });

  it("drops the buffer and the offline queue when consent is withdrawn", () => {
    const driver = new BatchRecordingDriver();
    const config = buildConfig(AnalyticsConfig);
    const offline = new MemoryAnalyticsOfflineQueueDriver(config);
    const { client, ledger } = engineWith(
      driver,
      { flushAt: 20, flushIntervalMs: 60_000 },
      offline,
    );
    trackPlans(client, "a");
    offline.save([]);
    ledger.set(ConsentCategory.Analytics, false);
    void client.flush();
    expect(driver.batches).toEqual([]);
    expect(offline.load()).toEqual([]);
  });
});

/** A lookup that knows the named instances of `drivers`. */
class MapAnalyticsDriverLookup extends Driver(AnalyticsDriverLookup) {
  private readonly drivers: Readonly<Record<string, AnalyticsDriver>>;

  constructor(drivers: Readonly<Record<string, AnalyticsDriver>>) {
    super();
    this.drivers = drivers;
  }

  driver(name: string): AnalyticsDriver | undefined {
    return this.drivers[name];
  }
}

/** A client with a `default` (analytics) and a `segment` (marketing) destination, `segment` routed by `routing`. */
function withDestinations(routing: { include?: string[]; exclude?: string[] } = {}) {
  const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
  const primary = new MemoryAnalyticsDriver();
  const segment = new MemoryAnalyticsDriver();
  const identity = new MemoryAnalyticsIdentityDriver();
  const client = new AnalyticsClient(
    buildConfig(AnalyticsConfig, {
      values: {
        ...SEND_AT_ONCE,
        destinations: [
          { driver: "default", category: ConsentCategory.Analytics },
          { driver: "segment", category: ConsentCategory.Marketing, ...routing },
        ],
      },
    }),
    primary,
    ledger,
    identity,
    undefined,
    new MapAnalyticsDriverLookup({ segment }),
  );
  return { client, ledger, primary, segment, identity };
}

describe("AnalyticsClient destinations (stackra-407)", () => {
  it("gates each destination by its own category", () => {
    const { client, ledger, primary, segment } = withDestinations();
    client.track(LeadSubmitted.create({ plan: "pro" }));
    ledger.set(ConsentCategory.Analytics, true);
    expect(sentNames(primary)).toEqual(["lead.submitted"]);
    expect(segment.delivered()).toEqual([]);
    ledger.set(ConsentCategory.Marketing, true);
    expect(sentNames(segment)).toEqual(["lead.submitted"]);
  });

  it("drops a refused destination's queue while the others still send", () => {
    const { client, ledger, primary, segment } = withDestinations();
    client.track(LeadSubmitted.create({ plan: "pro" }));
    ledger.set(ConsentCategory.Marketing, false);
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "team" }));
    expect(sentNames(primary)).toEqual(["lead.submitted", "lead.submitted"]);
    expect(segment.delivered()).toEqual([]);
  });

  it("shares the event id and the visitor ids across destinations", () => {
    const { client, ledger, primary, segment } = withDestinations();
    ledger.set(ConsentCategory.Analytics, true);
    ledger.set(ConsentCategory.Marketing, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    const [a] = primary.delivered();
    const [b] = segment.delivered();
    expect(b?.eventId).toBe(a?.eventId);
    expect(b?.anonymousId).toBe(a?.anonymousId);
    expect(b?.sessionId).toBe(a?.sessionId);
  });

  it("routes events by include and exclude, and sends identify everywhere", () => {
    const included = withDestinations({ include: ["newsletter.joined"] });
    included.ledger.set(ConsentCategory.Analytics, true);
    included.ledger.set(ConsentCategory.Marketing, true);
    included.client.track(LeadSubmitted.create({ plan: "pro" }));
    included.client.track(NewsletterJoined.create({ source: "footer", email: "a@b.example" }));
    included.client.identify("usr_1");
    expect(sentNames(included.segment)).toEqual(["newsletter.joined", "identify"]);
    expect(sentNames(included.primary)).toEqual([
      "lead.submitted",
      "newsletter.joined",
      "identify",
    ]);

    const excluded = withDestinations({ exclude: ["lead.submitted"] });
    excluded.ledger.set(ConsentCategory.Marketing, true);
    excluded.client.track(LeadSubmitted.create({ plan: "pro" }));
    excluded.client.track(NewsletterJoined.create({ source: "footer", email: "a@b.example" }));
    expect(sentNames(excluded.segment)).toEqual(["newsletter.joined"]);
  });

  it("keeps the identity only under consentCategory, even when another destination sends", () => {
    const { client, ledger, identity, segment } = withDestinations();
    ledger.set(ConsentCategory.Marketing, true);
    client.track(LeadSubmitted.create({ plan: "pro" }));
    expect(segment.delivered()).toHaveLength(1);
    expect(identity.read()).toBeNull();
    ledger.set(ConsentCategory.Analytics, true);
    client.track(LeadSubmitted.create({ plan: "team" }));
    expect(identity.read()).toEqual({ anonymousId: segment.delivered()[0]?.anonymousId });
    ledger.set(ConsentCategory.Analytics, false);
    expect(identity.read()).toBeNull();
  });

  it("refuses a destination naming an instance the lookup does not know", () => {
    const ledger = new ConsentLedger(buildConfig(ConsentConfig), new MemoryConsentStoreDriver());
    const config = buildConfig(AnalyticsConfig, {
      values: { destinations: [{ driver: "segment", category: ConsentCategory.Marketing }] },
    });
    expect(() => new AnalyticsClient(config, new MemoryAnalyticsDriver(), ledger)).toThrow(
      RangeError,
    );
  });
});

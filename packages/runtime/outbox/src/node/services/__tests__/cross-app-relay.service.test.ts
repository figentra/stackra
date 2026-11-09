/**
 * Stackra file contract:
 * Purpose: unit tests of `CrossAppRelayService`: a due delivery goes as one signed `POST <origin>/events/inbox` of its
 *          envelope (no `producer`, no redirect followed, a timeout signal) and is deleted on a 2xx; subscribers are
 *          sent in parallel and each stops at its first failure in a tick, so a failing consumer never holds back a
 *          healthy one; a network error, a timeout, a redirect, a 5xx, 408 or 429 backs off; any other 4xx dead-letters
 *          at once; the last attempt dead-letters; an unlisted subscriber dead-letters; every dead letter is logged
 *          with subscriber, type and code; nothing runs while another relay holds the lock; a tick leases its rows and
 *          sends them outside the lock, so another tick takes none in flight and a crashed relay's rows return when the
 *          lease ends; `work` logs a failed tick and stops when its signal aborts. A leased delivery is loaded and its
 *          outcome recorded in its owner through the bound `CallIsolation`; an owned delivery with no isolation bound,
 *          or one that does not load, fails the tick and is never skipped.
 * Boundary: test only; the memory delivery store, the memory lock driver, the real Ed25519 signer with a fresh key, a
 *           fixed clock, a recording logger and a stubbed `fetch`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 12 and 13; AC-005, SC-005).
 */
import { ClaimNotLoadedError, RowIsolationMissingError } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import type { AnyClass } from "@stackra/container";
import { Duration, Logger } from "@stackra/contracts";
import type { Actor, Clock } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { EventsRelayConfig } from "#config/events-relay.config";
import type { Delivery } from "#contracts/index";
import { deliveryOf } from "#core/__tests__/fixtures/delivery.fixture";
import {
  inboxConfig,
  relayConfig,
  relayKeyPair,
  secretsOf,
} from "#core/__tests__/fixtures/relay-key.fixture";
import type { RelayKeyPair } from "#core/__tests__/fixtures/relay-key.fixture";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";
import { ConfigSubscriberSourceDriver } from "#core/drivers/config-subscriber-source.driver";
import { ContractInboxVerifierDriver } from "#core/drivers/contract-inbox-verifier.driver";
import { Ed25519EventSignerDriver } from "#core/drivers/ed25519-event-signer.driver";
import { MemoryDeliveryDriver } from "#core/drivers/memory-delivery.driver";
import { CrossAppRelayService } from "#node/services/cross-app-relay.service";

const NOON = new Date(Date.UTC(2026, 10, 6, 12));

const LEASE_END = new Date(NOON.getTime() + 110_000);

/** The time the fake clock reads; a test moves it and puts it back. */
let current = NOON;

const clock = { now: () => new Date(current) } as Clock;

const TYPE = "payments.payment.captured.v1";

class RecordingLogger extends Logger {
  readonly errors: [string, Readonly<Record<string, unknown>> | undefined][] = [];

  onError: (() => void) | undefined;

  debug(): void {}

  info(): void {}

  warn(): void {}

  error(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.errors.push([event, fields]);
    this.onError?.();
  }
}

let key: RelayKeyPair;

let config: EventsRelayConfig;

beforeAll(async () => {
  key = await relayKeyPair("pay-dev-1");
  config = relayConfig({
    keys: [key.key],
    subscribers: [
      { member: "billing", inbox: "https://billing.example.com", events: [TYPE] },
      { member: "os", inbox: "http://localhost:4012", events: [TYPE] },
    ],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  current = NOON;
});

/** One request the stubbed `fetch` saw. */
interface Sent {
  readonly url: string;
  readonly init: RequestInit;
}

/** Stubs `fetch`: each origin answers `answers[origin]` (a status, or an error to throw), 204 by default. */
function transport(answers: Readonly<Record<string, number | Error>> = {}): Sent[] {
  const sent: Sent[] = [];
  vi.stubGlobal("fetch", async (url: URL, init: RequestInit) => {
    sent.push({ url: String(url), init });
    const answer = answers[url.origin] ?? 204;
    if (answer instanceof Error) throw answer;
    return new Response(answer === 204 ? null : "refused", { status: answer });
  });
  return sent;
}

/** An isolation that records the owner (`scopeId`) each unit runs in. */
function recordingIsolation(owners: (string | undefined)[]): CallIsolation {
  return {
    run: (actor: Actor, _scope: unknown, work: () => Promise<unknown>) => {
      owners.push(actor.scopeId);
      return work();
    },
  } as unknown as CallIsolation;
}

/**
 * A relay over a memory store holding `deliveries`, with a recording logger; `owned` makes every lease claim owned by
 * that scope, `unloaded` makes every load miss, and `isolation` is bound when given.
 */
async function relayOf(
  deliveries: readonly Delivery[],
  secrets: Record<string, string> = {},
  options: { owned?: string; unloaded?: boolean; isolation?: CallIsolation } = {},
) {
  const driver = new MemoryDeliveryDriver();
  await driver.write(deliveries);
  if (options.owned !== undefined) {
    const lease = driver.lease.bind(driver);
    driver.lease = async (...args) =>
      (await lease(...args)).map((claim) => ({ ...claim, ownerId: options.owned as never }));
  }
  if (options.unloaded === true) driver.load = async () => undefined;
  const lockDriver = new MemoryLockDriver(clock);
  const logger = new RecordingLogger();
  const relay = new CrossAppRelayService(
    driver,
    new ConfigSubscriberSourceDriver(config),
    new Ed25519EventSignerDriver(
      secretsOf({ STACKRA_EVENTS_SIGNING_KEY: key.secret, ...secrets }),
      config,
    ),
    new Locks(lockDriver, clock),
    clock,
  );
  const bound = new Map<AnyClass, object>([
    [Logger, logger],
    ...(options.isolation === undefined ? [] : [[CallIsolation, options.isolation] as const]),
  ]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
  };
  relay.connect(resolver);
  return { relay, driver, logger, lockDriver };
}

/** Every stored delivery, oldest first. */
async function stored(driver: MemoryDeliveryDriver) {
  const claims = await driver.list({ limit: 100 });
  return Promise.all(claims.map(async (claim) => (await driver.load(claim.id)) as Delivery));
}

describe(CrossAppRelayService, () => {
  it("posts a due delivery signed to the inbox and deletes it on a 2xx", async () => {
    const sent = transport();
    const { relay, driver } = await relayOf([deliveryOf()]);
    await expect(relay.relay()).resolves.toBe(1);
    expect(sent).toHaveLength(1);
    const [request] = sent;
    expect(request?.url).toBe("https://billing.example.com/events/inbox");
    expect(request?.init).toMatchObject({ method: "POST", redirect: "manual" });
    expect(request?.init.signal).toBeInstanceOf(AbortSignal);
    const body = String(request?.init.body);
    expect(JSON.parse(body)).toEqual(deliveryOf().envelope);
    expect(body).not.toContain("producer");
    const headers = request?.init.headers as Record<string, string>;
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["webhook-id"]).toBe("dlv_1");
    const verifier = new ContractInboxVerifierDriver(
      inboxConfig({ pay: { keys: { dev: [key.key] }, events: [TYPE] } }),
      clock,
    );
    await expect(verifier.verify(headers, body)).resolves.toMatchObject({
      verified: true,
      sender: { service: "pay" },
    });
    expect(await stored(driver)).toEqual([]);
  });

  it("keeps a healthy subscriber moving while a failing one stops at its first failure", async () => {
    const sent = transport({ "https://billing.example.com": 503 });
    const { relay, driver } = await relayOf([
      deliveryOf(),
      deliveryOf({ id: "dlv_2", eventId: "evt_2" }),
      deliveryOf({ id: "dlv_3", eventId: "evt_3" }),
      deliveryOf({ id: "dlv_4", eventId: "evt_4", subscriber: "os" }),
      deliveryOf({ id: "dlv_5", eventId: "evt_5", subscriber: "os" }),
    ]);
    await expect(relay.relay()).resolves.toBe(3);
    expect(sent.map((each) => each.url)).toHaveLength(3);
    const left = await stored(driver);
    expect(left.map((each) => [each.id, each.attempts])).toEqual([
      ["dlv_1", 1],
      ["dlv_2", 0],
      ["dlv_3", 0],
    ]);
    expect(left[0]?.lastError).toEqual({ code: "http_status", status: 503 });
    expect(left[0]?.availableAt.getTime()).toBeGreaterThan(NOON.getTime());
    // the untried rows wait for their lease to end
    expect(left[1]?.availableAt).toEqual(LEASE_END);
  });

  it("leases its rows: a tick while they are in flight takes none, and the send runs outside the lock", async () => {
    let answer: ((response: Response) => void) | undefined;
    const sent: string[] = [];
    vi.stubGlobal("fetch", (url: URL) => {
      sent.push(String(url));
      return new Promise<Response>((resolve) => {
        answer = resolve;
      });
    });
    const { relay, driver, lockDriver } = await relayOf([deliveryOf()]);
    const first = relay.relay();
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    await expect(relay.relay()).resolves.toBe(0);
    await new Locks(lockDriver, clock).tryWith(
      "outbox.cross-app",
      Duration.minutes(1),
      async () => {
        answer?.(new Response(null, { status: 204 }));
        await expect(first).resolves.toBe(1);
      },
    );
    expect(sent).toHaveLength(1);
    expect(await stored(driver)).toEqual([]);
  });

  it("sends a row a crashed relay leased once its lease ends", async () => {
    const sent = transport();
    const { relay, driver } = await relayOf([deliveryOf()]);
    await driver.lease(NOON, 10, LEASE_END);
    await expect(relay.relay()).resolves.toBe(0);
    current = LEASE_END;
    await expect(relay.relay()).resolves.toBe(1);
    expect(sent).toHaveLength(1);
    expect(await stored(driver)).toEqual([]);
  });

  it.each([
    ["a 408", 408, { code: "http_status", status: 408 }],
    ["a 429", 429, { code: "http_status", status: 429 }],
    ["a redirect", 302, { code: "http_status", status: 302 }],
    ["a network error", new TypeError("fetch failed"), { code: "network" }],
    ["a timeout", new DOMException("timed out", "TimeoutError"), { code: "timeout" }],
  ])("backs off after %s", async (_name, answer, failure) => {
    transport({ "https://billing.example.com": answer });
    const { relay, driver, logger } = await relayOf([deliveryOf()]);
    await relay.relay();
    const [retried] = await stored(driver);
    expect(retried).toMatchObject({ attempts: 1, lastError: failure });
    expect(retried?.deadAt).toBeUndefined();
    expect(logger.errors).toEqual([]);
  });

  it.each([400, 401, 404, 422])("dead-letters a %i at once and logs it", async (status) => {
    transport({ "https://billing.example.com": status });
    const { relay, driver, logger } = await relayOf([deliveryOf()]);
    await relay.relay();
    const [dead] = await stored(driver);
    expect(dead).toMatchObject({ attempts: 1, deadAt: NOON, lastError: { status } });
    expect(logger.errors).toEqual([
      [
        OUTBOX_LOG_EVENTS.deliveryDead,
        {
          deliveryId: "dlv_1",
          subscriber: "billing",
          type: TYPE,
          attempts: 1,
          code: "http_status",
          status,
        },
      ],
    ]);
  });

  it("dead-letters after the last attempt", async () => {
    transport({ "https://billing.example.com": 500 });
    const { relay, driver, logger } = await relayOf([deliveryOf({ attempts: 9 })]);
    await relay.relay();
    expect((await stored(driver))[0]).toMatchObject({ attempts: 10, deadAt: NOON });
    expect(logger.errors[0]?.[1]).toMatchObject({ attempts: 10, code: "http_status" });
  });

  it("dead-letters a delivery whose subscriber is no longer listed", async () => {
    const sent = transport();
    const { relay, driver } = await relayOf([deliveryOf({ subscriber: "gone" })]);
    await relay.relay();
    expect(sent).toEqual([]);
    expect((await stored(driver))[0]).toMatchObject({
      deadAt: NOON,
      lastError: { code: "unsubscribed" },
    });
  });

  it("sends nothing while another relay holds the lock", async () => {
    const sent = transport();
    const { relay, lockDriver } = await relayOf([deliveryOf()]);
    await new Locks(lockDriver, clock).tryWith(
      "outbox.cross-app",
      Duration.minutes(1),
      async () => {
        await expect(relay.relay()).resolves.toBe(0);
      },
    );
    expect(sent).toEqual([]);
  });

  it("loads and records an owned delivery in its owner through the bound isolation", async () => {
    transport();
    const owners: (string | undefined)[] = [];
    const { relay, driver } = await relayOf(
      [deliveryOf()],
      {},
      {
        owned: "scp_acme",
        isolation: recordingIsolation(owners),
      },
    );
    await expect(relay.relay()).resolves.toBe(1);
    expect(owners).toEqual(["scp_acme", "scp_acme"]);
    expect(await stored(driver)).toEqual([]);
  });

  it("refuses an owned delivery with no isolation bound, sending nothing", async () => {
    const sent = transport();
    const { relay } = await relayOf([deliveryOf()], {}, { owned: "scp_acme" });
    await expect(relay.relay()).rejects.toBeInstanceOf(RowIsolationMissingError);
    expect(sent).toEqual([]);
  });

  it("refuses a leased delivery that does not load, never skipping it", async () => {
    const sent = transport();
    const { relay } = await relayOf([deliveryOf()], {}, { unloaded: true });
    await expect(relay.relay()).rejects.toBeInstanceOf(ClaimNotLoadedError);
    expect(sent).toEqual([]);
  });

  it("works until aborted, logging a tick that fails without spending an attempt", async () => {
    transport();
    const { relay, driver, logger } = await relayOf([deliveryOf()], {
      STACKRA_EVENTS_SIGNING_KEY: "",
    });
    const controller = new AbortController();
    logger.onError = () => controller.abort();
    await relay.work({ signal: controller.signal });
    expect(logger.errors.map(([event]) => event)).toEqual([OUTBOX_LOG_EVENTS.crossAppRelayFailed]);
    expect((await stored(driver))[0]).toMatchObject({ attempts: 0 });
    await expect(relay.work({ signal: AbortSignal.abort() })).resolves.toBeUndefined();
  });
});

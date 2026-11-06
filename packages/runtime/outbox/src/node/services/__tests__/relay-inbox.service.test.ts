/**
 * Stackra file contract:
 * Purpose: unit tests of `RelayInboxService`: a verified delivery runs its listener once and answers 204, a repeat
 *          answers 204 and runs nothing; `producer` is the verified sender's service whatever the body says; an
 *          unsigned or forged request answers 401, logs the reason (never the body) and records nothing; a method other
 *          than POST answers 405; a body that is not JSON, an envelope that breaks its schema, data that breaks the
 *          event's schema and an unknown event answer 422 and record nothing; a newer version than this process reads
 *          answers 204 and waits; a throwing inbox propagates (the route answers a 5xx and the producer retries);
 *          header names match without case.
 * Boundary: test only; the real `InboxService` over the memory inbox and the real bus, a stand-in database, the real
 *           signer and verifier with a fresh key, a fixed clock and a recording logger.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 11, 13 and 18; AC-002, AC-007, SC-002).
 */
import type { Resolver } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";
import { Logger } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { EventBus, IntegrationEvent, Listener } from "@stackra/events";
import { beforeAll, describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import type { CrossAppEnvelope, EventEnvelope } from "#contracts/index";
import {
  inboxConfig,
  relayConfig,
  relayKeyPair,
  secretsOf,
} from "#core/__tests__/fixtures/relay-key.fixture";
import type { RelayKeyPair } from "#core/__tests__/fixtures/relay-key.fixture";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";
import { ContractInboxVerifierDriver } from "#core/drivers/contract-inbox-verifier.driver";
import { Ed25519EventSignerDriver } from "#core/drivers/ed25519-event-signer.driver";
import { MemoryInboxDriver } from "#core/drivers/memory-inbox.driver";
import { registerEventNames } from "#core/functions/register-event-names.function";
import { InboxService } from "#node/services/inbox.service";
import { RelayInboxService } from "#node/services/relay-inbox.service";

const NOON = new Date(Date.UTC(2026, 10, 6, 12));

const clock = { now: () => new Date(NOON) } as Clock;

class PaymentCaptured extends IntegrationEvent({ name: "payment.captured" }) {
  paymentId!: string;
}

registerSchemas([[PaymentCaptured, z.object({ paymentId: z.string() })]]);
registerEventNames([{ type: PaymentCaptured, name: "payments.payment.captured.v1" }]);

class RecordingListener extends Listener {
  readonly seen: string[] = [];

  async handle(event: PaymentCaptured): Promise<void> {
    this.seen.push(event.paymentId);
  }
}

class RecordingLogger extends Logger {
  readonly warnings: [string, Readonly<Record<string, unknown>> | undefined][] = [];

  debug(): void {}

  info(): void {}

  warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.warnings.push([event, fields]);
  }

  error(): void {}
}

let pay: RelayKeyPair;

let stranger: RelayKeyPair;

beforeAll(async () => {
  pay = await relayKeyPair("pay-dev-1");
  stranger = await relayKeyPair("stranger-dev-1");
});

/** The envelope body of `evt_1`, with `fields` replaced. */
function bodyOf(fields: Readonly<Record<string, unknown>> = {}): string {
  return JSON.stringify({
    id: "evt_1",
    type: "payments.payment.captured.v1",
    occurredAt: "2026-11-06T11:59:00.000Z",
    meta: { correlationId: "call-1" },
    data: { paymentId: "pay_1" },
    envelopeVersion: 1,
    ...fields,
  });
}

/** A POST of `body` signed by `pair` (the listed pay key by default). */
async function request(body: string, pair: RelayKeyPair = pay) {
  const signer = new Ed25519EventSignerDriver(
    secretsOf({ KEY: pair.secret }),
    relayConfig({ signingKey: "KEY", keys: [pay.key] }),
  );
  return { method: "POST", headers: { ...(await signer.sign("dlv_1", NOON, body)) }, body };
}

/** A relay inbox over a real inbox with one listener, or over `inbox` when given. */
function inboxOf(inbox?: Pick<InboxService, "receive">) {
  const bus = new EventBus(clock);
  const listener = new RecordingListener();
  bus.subscribe(PaymentCaptured, listener);
  const database = {
    transaction: async <T>(work: () => Promise<T>) => work(),
    withScope: async <T>(_scope: unknown, work: () => Promise<T>) => work(),
  } as unknown as Database;
  const driver = new MemoryInboxDriver();
  const logger = new RecordingLogger();
  const service = new RelayInboxService(
    (inbox ?? new InboxService(driver, bus, database, clock)) as InboxService,
    new ContractInboxVerifierDriver(inboxConfig({ pay: { dev: [pay.key] } }), clock),
  );
  const bound = new Map<AnyClass, object>([[Logger, logger]]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
  };
  service.connect(resolver);
  return { service, listener, driver, logger };
}

describe(RelayInboxService, () => {
  it("runs a verified delivery once and answers 204, a repeat too", async () => {
    const { service, listener } = inboxOf();
    const signed = await request(bodyOf());
    await expect(service.receive(signed)).resolves.toBe(204);
    await expect(service.receive(signed)).resolves.toBe(204);
    expect(listener.seen).toEqual(["pay_1"]);
  });

  it("sets producer from the verified sender, never from the body", async () => {
    const received: EventEnvelope[] = [];
    const { service } = inboxOf({
      receive: async (envelope) => {
        received.push(envelope);
        return true;
      },
    });
    await expect(service.receive(await request(bodyOf({ producer: "evil" })))).resolves.toBe(204);
    expect((received[0] as CrossAppEnvelope).producer).toBe("pay");
    expect(received[0]).toMatchObject({ id: "evt_1", envelopeVersion: 1 });
  });

  it("answers 401 to an unsigned or forged request, logs the reason only and records nothing", async () => {
    const { service, listener, driver, logger } = inboxOf();
    const body = bodyOf();
    await expect(service.receive({ method: "POST", headers: {}, body })).resolves.toBe(401);
    await expect(service.receive(await request(body, stranger))).resolves.toBe(401);
    expect(listener.seen).toEqual([]);
    await expect(driver.claim("evt_1", NOON)).resolves.toBe(true);
    expect(logger.warnings).toEqual([
      [OUTBOX_LOG_EVENTS.inboxUnverified, { reason: "missing_headers" }],
      [OUTBOX_LOG_EVENTS.inboxUnverified, { reason: "bad_signature" }],
    ]);
    expect(JSON.stringify(logger.warnings)).not.toContain("pay_1");
  });

  it("answers 405 to another method", async () => {
    const { service } = inboxOf();
    await expect(service.receive({ ...(await request(bodyOf())), method: "GET" })).resolves.toBe(
      405,
    );
  });

  it.each([
    ["a body that is not JSON", "{not json"],
    ["an envelope without its version", bodyOf({ envelopeVersion: undefined })],
    ["an envelope of another version", bodyOf({ envelopeVersion: 2 })],
    ["data that breaks the event's schema", bodyOf({ data: { paymentId: 7 } })],
    ["an unknown event", bodyOf({ type: "payments.refund.issued.v1" })],
  ])("answers 422 to %s and records nothing", async (_name, body) => {
    const { service, listener, driver, logger } = inboxOf();
    await expect(service.receive(await request(body))).resolves.toBe(422);
    expect(listener.seen).toEqual([]);
    await expect(driver.claim("evt_1", NOON)).resolves.toBe(true);
    expect(logger.warnings[0]?.[0]).toBe(OUTBOX_LOG_EVENTS.inboxInvalid);
  });

  it("answers 204 to a newer version and waits for the older one", async () => {
    const { service, listener, driver } = inboxOf();
    await expect(
      service.receive(await request(bodyOf({ type: "payments.payment.captured.v2" }))),
    ).resolves.toBe(204);
    expect(listener.seen).toEqual([]);
    await expect(driver.claim("evt_1", NOON)).resolves.toBe(true);
  });

  it("lets a throwing inbox propagate, so the producer retries", async () => {
    const { service } = inboxOf({
      receive: async () => {
        throw new TypeError("listener down");
      },
    });
    await expect(service.receive(await request(bodyOf()))).rejects.toThrow("listener down");
  });

  it("matches header names without case and takes a raw byte body", async () => {
    const { service, listener } = inboxOf();
    const signed = await request(bodyOf());
    const headers = Object.fromEntries(
      Object.entries(signed.headers).map(([name, value]) => [name.toUpperCase(), [value]]),
    );
    await expect(
      service.receive({
        method: "post",
        headers,
        body: new TextEncoder().encode(signed.body),
      }),
    ).resolves.toBe(204);
    expect(listener.seen).toEqual(["pay_1"]);
  });
});

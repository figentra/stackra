/**
 * Stackra file contract:
 * Purpose: integration test of the cross-app event relay end to end, on real Postgres and real HTTP: a published event
 *          fanned out to a subscriber is signed and posted by one relay tick to the consumer's inbox, which runs its
 *          listener once and answers 204, and the delivery row is removed; the same event delivered again answers 204
 *          and runs nothing; a delivery signed with a key the consumer does not hold answers 401, and an event the
 *          producer does not publish answers 403, each dead-lettered by the producer with the status it was refused with.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres (the testbed's
 *           `--postgres`, user `postgres` with trust auth) and is skipped elsewhere. It creates a fresh database per run,
 *           applies the compiled 0002 and 0005 migrations as `usePostgres` does, and drops it after. Producer and consumer
 *           share that database (their tables differ), and the consumer's inbox route is a `node:http` server on an
 *           ephemeral port that hands the raw request to `RelayInboxService`. Keys are generated per run; locks are in
 *           memory; the clock is the system's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0511 (decisions 11 to 13, 16 to 18; AC-001, AC-002, AC-007); ADR 0182 (integration tier);
 *                     ADR 0022; ADR 0269.
 */
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo, Server } from "node:net";

import { mintPublicId } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import { compileMigration } from "@stackra/database";
import { PostgresDatabaseDriver } from "@stackra/database/node";
import { EventBus, IntegrationEvent, Listener } from "@stackra/events";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import type { EventEnvelope } from "#contracts/index";
import {
  inboxConfig,
  relayConfig,
  relayKeyPair,
  secretsOf,
} from "#core/__tests__/fixtures/relay-key.fixture";
import type { RelayKeyPair } from "#core/__tests__/fixtures/relay-key.fixture";
import { ConfigSubscriberSourceDriver } from "#core/drivers/config-subscriber-source.driver";
import { ContractInboxVerifierDriver } from "#core/drivers/contract-inbox-verifier.driver";
import { Ed25519EventSignerDriver } from "#core/drivers/ed25519-event-signer.driver";
import { registerEventNames } from "#core/functions/register-event-names.function";
import { CreateInboxMigration } from "#node/database/migrations/0002-create-inbox.migration";
import { CreateDeliveriesMigration } from "#node/database/migrations/0005-create-deliveries.migration";
import { PostgresDeliveryDriver } from "#node/drivers/postgres-delivery.driver";
import { PostgresInboxDriver } from "#node/drivers/postgres-inbox.driver";
import { CrossAppFanOut } from "#node/services/cross-app-fan-out.service";
import { CrossAppRelayService } from "#node/services/cross-app-relay.service";
import { InboxService } from "#node/services/inbox.service";
import { RelayInboxService } from "#node/services/relay-inbox.service";

/** The testbed's throwaway Postgres; unset on the Mac and in plain CI, where the file is skipped. */
const HOST = process.env["TESTBED_POSTGRES_HOST"];

/** This run's own database. */
const DATABASE = `outbox_relay_${randomUUID().replaceAll("-", "").slice(0, 12)}`;

const CAPTURED = "payments.payment.captured.v1";

/** An event the producer sends but the consumer's pinned contract does not list for it. */
const REFUNDED = "payments.refund.issued.v1";

const clock = { now: () => new Date() } as Clock;

class PaymentCaptured extends IntegrationEvent({ name: "payment.captured" }) {
  paymentId!: string;
}

registerSchemas([[PaymentCaptured, z.object({ paymentId: z.string() })]]);
registerEventNames([{ type: PaymentCaptured, name: CAPTURED }]);

class RecordingListener extends Listener {
  readonly seen: string[] = [];

  async handle(event: PaymentCaptured): Promise<void> {
    this.seen.push(event.paymentId);
  }
}

/** The connection string of database `name` on the testbed's Postgres. */
function urlOf(name: string): string {
  return `postgres://postgres@${HOST ?? "localhost"}:5432/${name}`;
}

/** A fresh envelope of `type` for payment `paymentId`. */
function envelopeOf(type: string, paymentId: string): EventEnvelope {
  return {
    id: mintPublicId("evt"),
    type,
    occurredAt: new Date().toISOString(),
    meta: { correlationId: `call-${paymentId}` },
    data: { paymentId },
  };
}

describe.skipIf(HOST === undefined)("cross-app relay end to end", () => {
  const listener = new RecordingListener();
  /** The status of every request the consumer's inbox answered, in order. */
  const answers: number[] = [];
  const state: {
    admin?: PostgresDatabaseDriver;
    database?: PostgresDatabaseDriver;
    server?: Server;
    pay?: RelayKeyPair;
    stranger?: RelayKeyPair;
    deliveries?: PostgresDeliveryDriver;
    fanOut?: CrossAppFanOut;
    relay?: CrossAppRelayService;
    forged?: CrossAppRelayService;
  } = {};

  /** Each part, once `beforeAll` set it. */
  function the<K extends keyof typeof state>(key: K): NonNullable<(typeof state)[K]> {
    const value = state[key];
    if (value === undefined) throw new Error(`${key} is not set up`);
    return value as NonNullable<(typeof state)[K]>;
  }

  beforeAll(async () => {
    const admin = await PostgresDatabaseDriver.connect({ url: urlOf("postgres"), entities: [] });
    state.admin = admin;
    await admin.orm.schema.execute(`create database "${DATABASE}"`, { wrap: false });
    const database = await PostgresDatabaseDriver.connect({ url: urlOf(DATABASE), entities: [] });
    state.database = database;
    for (const migration of [
      compileMigration(CreateInboxMigration, { schema: "outbox", createsSchema: true }),
      compileMigration(CreateDeliveriesMigration, { schema: "outbox" }),
    ])
      for (const step of migration.steps)
        await database.orm.schema.execute(step.sql.join(";\n"), { wrap: step.transactional });

    const pay = await relayKeyPair("pay-dev-1");
    const stranger = await relayKeyPair("stranger-dev-1");
    state.pay = pay;
    state.stranger = stranger;

    // the consumer: its inbox pins pay's key and pay's one event, behind a real HTTP route
    const bus = new EventBus(clock);
    bus.subscribe(PaymentCaptured, listener);
    const pinned = inboxConfig({ pay: { keys: { dev: [pay.key] }, events: [CAPTURED] } });
    const inbox = new RelayInboxService(
      new InboxService(new PostgresInboxDriver(database), bus, database, clock),
      new ContractInboxVerifierDriver(pinned, clock),
      pinned,
    );
    const server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        const answer: Promise<number> =
          request.url === "/events/inbox"
            ? inbox
                .receive({
                  method: request.method ?? "",
                  headers: request.headers,
                  body: new Uint8Array(Buffer.concat(chunks)),
                })
                .catch(() => 500)
            : Promise.resolve(404);
        void answer.then((status) => {
          answers.push(status);
          response.writeHead(status).end();
        });
      });
    });
    state.server = server;
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address() as AddressInfo;

    // the producer: one subscriber taking both events at that inbox
    const config = relayConfig({
      keys: [pay.key],
      subscribers: [
        { member: "billing", inbox: `http://127.0.0.1:${port}`, events: [CAPTURED, REFUNDED] },
      ],
    });
    const source = new ConfigSubscriberSourceDriver(config);
    const deliveries = new PostgresDeliveryDriver(database);
    state.deliveries = deliveries;
    state.fanOut = new CrossAppFanOut(source, deliveries);
    const relayWith = (secret: string) =>
      new CrossAppRelayService(
        deliveries,
        source,
        new Ed25519EventSignerDriver(secretsOf({ STACKRA_EVENTS_SIGNING_KEY: secret }), config),
        new Locks(new MemoryLockDriver(clock), clock),
        clock,
      );
    state.relay = relayWith(pay.secret);
    // signs under pay's listed key id with a key the consumer never saw
    state.forged = relayWith(stranger.secret);
  }, 60_000);

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (state.server === undefined) resolve();
      else state.server.close(() => resolve());
    });
    await state.database?.close();
    await state.admin?.orm.schema.execute(`drop database if exists "${DATABASE}" with (force)`, {
      wrap: false,
    });
    await state.admin?.close();
  });

  /** The stored deliveries of event `eventId`. */
  async function deliveriesOf(eventId: string) {
    return (await the("deliveries").list({ limit: 100 })).filter(
      (delivery) => delivery.eventId === eventId,
    );
  }

  /** Whether the consumer's inbox recorded event `eventId`. */
  async function received(eventId: string): Promise<boolean> {
    // raw-sql: the inbox has no model; one bound lookup
    const rows = await the("database")
      .em()
      .execute('select event_id from "outbox"."inbox" where event_id = ?', [eventId]);
    return Array.isArray(rows) && rows.length === 1;
  }

  /** Publishes `envelope` to the subscriber and runs one tick of `relay`; how many deliveries it tried. */
  async function publishAndTick(envelope: EventEnvelope, relay = the("relay")): Promise<number> {
    await the("fanOut").fanOut([envelope], clock.now());
    expect(await deliveriesOf(envelope.id)).toHaveLength(1);
    return relay.relay();
  }

  it("delivers a published event in one tick: the listener runs once and the delivery row is removed", async () => {
    const envelope = envelopeOf(CAPTURED, "pay_once");
    expect(await publishAndTick(envelope)).toBe(1);
    expect(answers.at(-1)).toBe(204);
    expect(listener.seen.filter((id) => id === "pay_once")).toHaveLength(1);
    expect(await deliveriesOf(envelope.id)).toEqual([]);
    expect(await received(envelope.id)).toBe(true);
  });

  it("answers 2xx to the same event delivered again and does not run the listener twice", async () => {
    const envelope = envelopeOf(CAPTURED, "pay_again");
    expect(await publishAndTick(envelope)).toBe(1);
    expect(await publishAndTick(envelope)).toBe(1);
    expect(answers.slice(-2)).toEqual([204, 204]);
    expect(listener.seen.filter((id) => id === "pay_again")).toHaveLength(1);
    expect(await deliveriesOf(envelope.id)).toEqual([]);
  });

  it("refuses a forged signature with 401: nothing runs and the producer dead-letters it", async () => {
    const envelope = envelopeOf(CAPTURED, "pay_forged");
    expect(await publishAndTick(envelope, the("forged"))).toBe(1);
    expect(answers.at(-1)).toBe(401);
    expect(listener.seen).not.toContain("pay_forged");
    expect(await received(envelope.id)).toBe(false);
    const [dead] = await deliveriesOf(envelope.id);
    expect(dead?.lastError).toEqual({ code: "http_status", status: 401 });
    expect(dead?.deadAt).toBeInstanceOf(Date);
  });

  it("refuses an event the producer does not publish with 403 and the producer dead-letters it", async () => {
    const envelope = envelopeOf(REFUNDED, "pay_refund");
    expect(await publishAndTick(envelope)).toBe(1);
    expect(answers.at(-1)).toBe(403);
    expect(await received(envelope.id)).toBe(false);
    const [dead] = await deliveriesOf(envelope.id);
    expect(dead?.lastError).toEqual({ code: "http_status", status: 403 });
    expect(dead?.deadAt).toBeInstanceOf(Date);
  });
});

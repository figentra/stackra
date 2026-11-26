/**
 * Stackra file contract:
 * Purpose: the erasure and personal-data guards of the outbox on real Postgres under row security (STA-2629): in a
 *          tenant session the redaction rewrites the tenant's held message naming the subject and counts the
 *          platform message it may not change as unrewritable, which keeps its payload; the message insert refuses an
 *          event declaring a `@Classified` field in a session with no tenant and writes nothing, and writes it inside
 *          a tenant. And the producer (STA-1792): the relay names its own service on every envelope, never the
 *          `producer` a stored message's metadata claims.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`); the superuser seeds and reads back, everything under
 *           test runs as the NOBYPASSRLS service role (`asService`). Tests share the database and run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0189 (decision 2); ADR 0239 (2026-11-07 amendment, gap C); ADR 0509 (decision 7); ADR 0511
 *                     (decision 11); ADR 0182 (integration tier); ADR 0022.
 */
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import { Clock, DataClassification } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import { Classified, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { OutboxConfig } from "#config/outbox.config";
import { EventPublisher, MessageKind } from "#contracts/index";
import type { EventEnvelope, OutboxMessage } from "#contracts/index";
import { PlatformPersonalEventError } from "#core/errors/platform-personal-event.error";
import { redactSubjectMessages } from "#core/functions/redact-subject-messages.function";
import { registerEventNames } from "#core/functions/register-event-names.function";
import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresChangeFeedDriver } from "#node/drivers/postgres-change-feed.driver";
import { PostgresOutboxDriver } from "#node/drivers/postgres-outbox.driver";
import { insertMessages } from "#node/functions/insert-messages.function";
import { OutboxRelayService } from "#node/services/outbox-relay.service";

/** A tenant node. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";

const NOW = new Date();

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class RecordingPublisher extends Driver(EventPublisher) {
  readonly published: EventEnvelope[] = [];

  async publish(envelope: EventEnvelope): Promise<void> {
    this.published.push(envelope);
  }
}

class CustomerRenamed extends IntegrationEvent({ name: "customer.renamed" }) {
  @Classified(DataClassification.Personal)
  name!: string;

  customerId!: string;
}

registerSchemas([[CustomerRenamed, z.object({ customerId: z.string(), name: z.string() })]]);
registerEventNames([{ type: CustomerRenamed, name: "crm.customer.renamed.v1" }]);

/** A due message of `type` with `data`. */
const message = (id: `evt_${string}`, type: string, data: unknown): OutboxMessage => ({
  id,
  kind: MessageKind.Event,
  type,
  data,
  meta: {},
  occurredAt: NOW,
  attempts: 0,
  availableAt: NOW,
});

describe.skipIf(HOST === undefined)("outbox erasure and producer on Postgres", () => {
  let postgres: OwnerPostgres;

  beforeAll(async () => {
    postgres = await ownerPostgres();
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds a due message `id` of `owner` (null: the platform's) with `data` and `meta`. */
  const seed = (id: string, owner: string | null, data: unknown, meta: unknown = {}) =>
    superuser(
      `insert into outbox.messages (id, kind, type, data, meta, occurred_at, attempts, available_at, tenant_id)
         values (?, 'event', 'orders.order.paid.v1', ?::jsonb, ?::jsonb, ?, 0, ?, ?)`,
      [id, JSON.stringify(data), JSON.stringify(meta), NOW, new Date(NOW.getTime() - 1000), owner],
    );

  it("rewrites the tenant's held message and counts the platform's as unrewritable, leaving it as it was", async () => {
    await seed("evt_acme", ACME, { userId: "usr_1", email: "a@example.com" });
    await seed("evt_platform", null, { userId: "usr_1", email: "a@example.com" });
    const driver = new PostgresOutboxDriver(postgres.database);

    await expect(
      asService(postgres, ACME, () => redactSubjectMessages(driver, "usr_1", new Set(["email"]))),
    ).resolves.toEqual({ rewritten: 1, unrewritable: 1 });

    const rows = await superuser("select id, data from outbox.messages order by id");
    expect(rows).toEqual([
      { id: "evt_acme", data: { userId: "usr_1", email: null } },
      { id: "evt_platform", data: { userId: "usr_1", email: "a@example.com" } },
    ]);
    await superuser("delete from outbox.messages");
  });

  it("refuses an event with a personal field outside a tenant and writes it inside one", async () => {
    const renamed = message("evt_renamed", "crm.customer.renamed.v1", {
      customerId: "cus_1",
      name: "Ada",
    });
    await expect(
      asService(postgres, undefined, () => insertMessages(postgres.database.em(), [renamed])),
    ).rejects.toBeInstanceOf(PlatformPersonalEventError);
    expect(await superuser("select id from outbox.messages")).toEqual([]);

    await asService(postgres, ACME, () => insertMessages(postgres.database.em(), [renamed]));
    expect(await superuser("select id, tenant_id from outbox.messages")).toEqual([
      { id: "evt_renamed", tenant_id: ACME },
    ]);
    await superuser("delete from outbox.messages");
  });

  it("names its own service on every envelope, never the producer a stored message claims (STA-1792)", async () => {
    await seed("evt_claims", ACME, { orderId: "ord_1" }, { producer: "approvals" });
    const publisher = new RecordingPublisher();
    const relay = new OutboxRelayService(
      new PostgresOutboxDriver(postgres.database),
      new PostgresChangeFeedDriver(postgres.database),
      publisher,
      new Locks(new MemoryLockDriver(new SystemClock()), new SystemClock()),
      postgres.database,
      new SystemClock(),
      buildConfig(OutboxConfig, { values: { batchWindowSeconds: 0 } }),
    );
    const bound = new Map<AnyClass, object>([[CallIsolation, new OwnerIsolation(postgres)]]);
    const resolver: Resolver = {
      has: (type) => bound.has(type),
      get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
    };
    relay.connect(resolver, { service: "orders" });

    await expect(asService(postgres, undefined, () => relay.relay())).resolves.toBe(1);

    expect(publisher.published.map(({ id, producer }) => [id, producer])).toEqual([
      ["evt_claims", "orders"],
    ]);
  });
});

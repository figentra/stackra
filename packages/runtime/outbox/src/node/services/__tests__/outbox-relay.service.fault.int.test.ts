/**
 * Stackra file contract:
 * Purpose: the database fault-injection tests of `OutboxRelayService` on real Postgres (ADR 0182 decisions 3 and 4): a
 *          row trigger (`postgresFault`) fails the write the relay records a delivery with, as the NOBYPASSRLS service
 *          role relays an owner's event. When the delete of a published message fails, the tick fails, the message is
 *          kept with no attempt counted and is published again under the same id on the next tick, then deleted:
 *          delivered at least once, never lost, never dead. When the update that records a failed publish fails, the tick fails and its
 *          transaction rolls back: the message is untouched and is published on the next tick.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped
 *           elsewhere. One fresh database for the file (`ownerPostgres`); each test arms its fault as the superuser and
 *           removes it after; the relay runs as the service role in a session with no owner with the owner's isolation
 *           bound (`asService`, `OwnerIsolation`). The transport is a recording publisher; the inbox's deduplication of
 *           a second publish is proved in `outbox-relay.service.fault.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 3 and 4: database faults in the integration tier); ADR 0078 (decision 4:
 *                     at least once); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { afterAll, beforeAll, describe, expect, it, postgresFault } from "@stackra/testing";
import type { PostgresFault } from "@stackra/testing";

import { OutboxConfig } from "#config/outbox.config";
import { EventPublisher } from "#contracts/index";
import type { EventEnvelope } from "#contracts/index";
import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresChangeFeedDriver } from "#node/drivers/postgres-change-feed.driver";
import { PostgresOutboxDriver } from "#node/drivers/postgres-outbox.driver";
import { OutboxRelayService } from "#node/services/outbox-relay.service";

/** The owner (a tenant node) every message here belongs to. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class RecordingPublisher extends Driver(EventPublisher) {
  readonly published: string[] = [];

  failing = false;

  async publish(envelope: EventEnvelope): Promise<void> {
    if (this.failing) throw new TypeError("transport down");
    this.published.push(envelope.id);
  }
}

/** A resolver binding `bound`. */
const resolverOf = (bound: readonly (readonly [AnyClass, object])[]): Resolver => {
  const map = new Map<AnyClass, object>(bound);
  return {
    has: (type) => map.has(type),
    get: <T extends object>(type: AnyClass<T>) => map.get(type) as T,
  };
};

describe.skipIf(HOST === undefined)("OutboxRelayService under database faults on Postgres", () => {
  let postgres: OwnerPostgres;

  beforeAll(async () => {
    postgres = await ownerPostgres();
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser: a seed, a fault, a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Runs `work` with `fault` armed, and removes it after. */
  const withFault = async <T>(fault: PostgresFault, work: () => Promise<T>): Promise<T> => {
    for (const sql of fault.install) await superuser(sql);
    try {
      return await work();
    } finally {
      for (const sql of fault.remove) await superuser(sql);
    }
  };

  /** Seeds a due event message `id` of the owner. */
  const seed = (id: string) =>
    superuser(
      `insert into outbox.messages (id, kind, type, data, meta, occurred_at, attempts, available_at, tenant_id)
         values (?, 'event', 'orders.order.paid.v1', '{}'::jsonb, '{}'::jsonb, now(), 0, now() - interval '1 second', ?)`,
      [id, ACME],
    );

  /** Message `id` as `[attempts, dead]`, or undefined once it is gone. */
  const stateOf = async (id: string) => {
    const [row] = await superuser(
      "select attempts, dead_at is not null as dead from outbox.messages where id = ?",
      [id],
    );
    return row === undefined ? undefined : [row["attempts"], row["dead"]];
  };

  /** A relay over the Postgres stores with the owner's isolation, publishing through `publisher`. */
  const relayOf = (publisher: RecordingPublisher) => {
    const relay = new OutboxRelayService(
      new PostgresOutboxDriver(postgres.database),
      new PostgresChangeFeedDriver(postgres.database),
      publisher,
      new Locks(new MemoryLockDriver(new SystemClock()), new SystemClock()),
      postgres.database,
      new SystemClock(),
      buildConfig(OutboxConfig, { values: { batchWindowSeconds: 0 } }),
    );
    relay.connect(resolverOf([[CallIsolation, new OwnerIsolation(postgres)]]));
    return relay;
  };

  /** One tick as the service role in a session with no owner. */
  const tick = (relay: OutboxRelayService) => asService(postgres, undefined, () => relay.relay());

  it("fails the tick when the delete of a published message fails, counts no attempt, and publishes it again under the same id", async () => {
    await seed("evt_fault_delete");
    const publisher = new RecordingPublisher();
    const relay = relayOf(publisher);
    const fault = postgresFault({ name: "message_remove", table: "outbox.messages", on: "delete" });
    await withFault(fault, async () => {
      await expect(tick(relay)).rejects.toThrow(fault.message);
      expect(await stateOf("evt_fault_delete")).toEqual([0, false]);
      await expect(tick(relay)).resolves.toBe(1);
    });
    expect(publisher.published).toEqual(["evt_fault_delete", "evt_fault_delete"]);
    expect(await stateOf("evt_fault_delete")).toBeUndefined();
  });

  it("fails the tick when the update recording a failed publish fails, and loses nothing", async () => {
    await seed("evt_fault_retry");
    const publisher = new RecordingPublisher();
    publisher.failing = true;
    const relay = relayOf(publisher);
    const fault = postgresFault({
      name: "message_retry",
      table: "outbox.messages",
      on: "update",
      sqlstate: "40001",
    });
    await withFault(fault, async () => {
      await expect(tick(relay)).rejects.toThrow(fault.message);
      expect(await stateOf("evt_fault_retry")).toEqual([0, false]);
      publisher.failing = false;
      await expect(tick(relay)).resolves.toBe(1);
    });
    expect(publisher.published).toEqual(["evt_fault_retry"]);
    expect(await stateOf("evt_fault_retry")).toBeUndefined();
  });
});

/**
 * Stackra file contract:
 * Purpose: the isolation test of the outbox's tenant-owned tables on real Postgres, each hot path run as the NOBYPASSRLS
 *          service role over rows of two owners and a platform (NULL) row. For every table a session with no owner
 *          reads only the platform row directly while the system function's claim reaches every row. The relay claims,
 *          loads, publishes and removes each owner's message in that owner, records retries and dead letters there, and
 *          refuses an owned message with no isolation bound; the prune deletes every owner's dead letters in its owner.
 *          The cross-app lease reaches every owner's delivery and moves its lease; a delivery loads only in its owner and
 *          its outcomes land there; the operator's commands list and replay across owners by claim-then-load. The
 *          change log is claimed across owners and loaded per owner, a partition read directly is not open, a replay
 *          position spans the whole log, and the retention deletes expired default-partition rows per owner and makes
 *          new partitions with row security forced and the log's policies. Two owners appending to one replica
 *          partition take consecutive positions, and each reads only its own rows.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`); the superuser seeds and reads the catalogue, everything
 *           under test runs as the service role (`asService`, `OwnerIsolation`). Tests share the database and run in
 *           order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0495; ADR 0182 (integration tier); ADR 0022;
 *                     `.agents/rules/tenancy.md` (points 7 and 8).
 */
import { inRowOwner, RowIsolationMissingError } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { runCommandForTest } from "@stackra/console/testing";
import { type AnyClass, type Container, Driver } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { OutboxConfig } from "#config/outbox.config";
import { EventPublisher } from "#contracts/index";
import type { ChangeClaim, EventEnvelope } from "#contracts/index";
import { OUTBOX_ACTOR_ID } from "#core/constants/outbox-actor-id.constant";
import { loadChanges } from "#core/functions/load-changes.function";
import { maintainChangeLog } from "#core/functions/maintain-change-log.function";
import { pruneOutbox } from "#core/functions/prune-outbox.function";
import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { RelayDeliveriesCommand } from "#node/commands/relay-deliveries.command";
import { RelayReplayCommand } from "#node/commands/relay-replay.command";
import { PostgresChangeFeedDriver } from "#node/drivers/postgres-change-feed.driver";
import { PostgresDeliveryDriver } from "#node/drivers/postgres-delivery.driver";
import { PostgresInboxDriver } from "#node/drivers/postgres-inbox.driver";
import { PostgresOutboxDriver } from "#node/drivers/postgres-outbox.driver";
import { PostgresReplicaLogDriver } from "#node/drivers/postgres-replica-log.driver";
import { OutboxRelayService } from "#node/services/outbox-relay.service";

/** Two owners (tenant nodes) and their paths. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

const NOW = new Date();

const DAY = 86_400_000;

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class RecordingPublisher extends Driver(EventPublisher) {
  readonly published: EventEnvelope[] = [];

  failing = false;

  async publish(envelope: EventEnvelope): Promise<void> {
    if (this.failing) throw new TypeError("transport down");
    this.published.push(envelope);
  }
}

/** Polls `read` until `done` holds (a change commits for every snapshot only once older transactions end). */
async function eventually<T>(read: () => Promise<T>, done: (value: T) => boolean): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    const value = await read();
    if (done(value) || attempt >= 50) return value;
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
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

describe.skipIf(HOST === undefined)("outbox row security on Postgres", () => {
  let postgres: OwnerPostgres;
  let isolation: OwnerIsolation;

  beforeAll(async () => {
    postgres = await ownerPostgres();
    isolation = new OwnerIsolation(postgres);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** The ids `sql` reads as the service role in `owner` (none: no owner). */
  const idsAs = async (owner: string | undefined, sql: string): Promise<unknown[]> =>
    (
      (await asService(postgres, owner, () => postgres.database.em().execute(sql))) as {
        id: unknown;
      }[]
    ).map((row) => row.id);

  /** A relay over the Postgres stores, connected to `bound`. */
  const relayOf = (
    publisher: RecordingPublisher,
    bound: readonly (readonly [AnyClass, object])[],
  ) => {
    const relay = new OutboxRelayService(
      new PostgresOutboxDriver(postgres.database),
      new PostgresChangeFeedDriver(postgres.database),
      publisher,
      new Locks(new MemoryLockDriver(new SystemClock()), new SystemClock()),
      postgres.database,
      new SystemClock(),
      buildConfig(OutboxConfig, { values: { batchWindowSeconds: 0 } }),
    );
    relay.connect(resolverOf(bound));
    return relay;
  };

  /** Seeds a due message `id` of `owner` (null: the platform's). */
  const seedMessage = (id: string, owner: string | null) =>
    superuser(
      `insert into outbox.messages (id, kind, type, data, meta, occurred_at, attempts, available_at, tenant_id)
         values (?, 'event', 'orders.order.paid.v1', '{}'::jsonb, '{}'::jsonb, ?, 0, ?, ?)`,
      [id, NOW, new Date(NOW.getTime() - 1000), owner],
    );

  /** Seeds a due delivery `id` of `owner` (null: the platform's) to billing. */
  const seedDelivery = (id: string, owner: string | null) =>
    superuser(
      `insert into outbox.deliveries (id, event_id, subscriber, type, envelope, attempts, available_at, created_at, tenant_id)
         values (?, ?, 'billing', 'payments.payment.captured.v1', '{}'::jsonb, 0, ?, ?, ?)`,
      [id, `evt_${id}`, new Date(NOW.getTime() - 1000), NOW, owner],
    );

  /** Seeds a change of `owner` (null: the platform's) to Order `id` at `at`. */
  const seedChange = (id: string, owner: string | null, at: Date) =>
    superuser(
      `insert into outbox.changes (type, data, meta, occurred_at, tenant_id)
         values ('Order', ?::jsonb, '{}'::jsonb, ?, ?)`,
      [JSON.stringify({ model: "Order", id, kind: "created", fields: [] }), at, owner],
    );

  describe("messages", () => {
    it("shows a session with no owner only the platform row, while the claim reaches every owner's", async () => {
      await seedMessage("evt_acme1", ACME);
      await seedMessage("evt_globex1", GLOBEX);
      await seedMessage("evt_platform1", null);
      expect(await idsAs(undefined, "select id from outbox.messages")).toEqual(["evt_platform1"]);
      expect((await idsAs(ACME, "select id from outbox.messages order by id")).sort()).toEqual([
        "evt_acme1",
        "evt_platform1",
      ]);
      const driver = new PostgresOutboxDriver(postgres.database);
      const claims = await asService(postgres, undefined, () => driver.claim(new Date(), 10));
      expect(claims.map((claim) => [claim.id, claim.ownerId]).sort()).toEqual([
        ["evt_acme1", ACME],
        ["evt_globex1", GLOBEX],
        ["evt_platform1", undefined],
      ]);
      await expect(
        asService(postgres, GLOBEX, () => driver.load("evt_acme1")),
      ).resolves.toBeUndefined();
      await expect(
        asService(postgres, ACME, () => driver.load("evt_acme1")),
      ).resolves.toMatchObject({ id: "evt_acme1" });
    });

    it("refuses an owned message when no isolation is bound, and keeps it", async () => {
      const relay = relayOf(new RecordingPublisher(), []);
      await expect(asService(postgres, undefined, () => relay.relay())).rejects.toBeInstanceOf(
        RowIsolationMissingError,
      );
      expect(await superuser("select id from outbox.messages")).toHaveLength(3);
    });

    it("records each owner's failure in its owner, then dead-letters it at the last attempt", async () => {
      const publisher = new RecordingPublisher();
      publisher.failing = true;
      const relay = relayOf(publisher, [[CallIsolation, isolation]]);
      await expect(asService(postgres, undefined, () => relay.relay())).resolves.toBe(3);
      expect(
        await superuser("select id, attempts from outbox.messages where attempts = 1 order by id"),
      ).toHaveLength(3);
      await superuser("update outbox.messages set attempts = 9, available_at = ?", [
        new Date(NOW.getTime() - 1000),
      ]);
      await asService(postgres, undefined, () => relay.relay());
      expect(
        await superuser("select id from outbox.messages where dead_at is not null"),
      ).toHaveLength(3);
    });

    it("prunes every owner's dead letters, each in its owner", async () => {
      const driver = new PostgresOutboxDriver(postgres.database);
      const report = await asService(postgres, undefined, () =>
        pruneOutbox(
          driver,
          new PostgresInboxDriver(postgres.database),
          0,
          new Date(Date.now() + DAY),
          isolation,
        ),
      );
      expect(report).toEqual({ dead: 3 });
      expect(await superuser("select id from outbox.messages")).toEqual([]);
    });

    it("loads, publishes and removes every owner's message in its owner", async () => {
      await seedMessage("evt_acme2", ACME);
      await seedMessage("evt_globex2", GLOBEX);
      await seedMessage("evt_platform2", null);
      const publisher = new RecordingPublisher();
      const relay = relayOf(publisher, [[CallIsolation, isolation]]);
      await expect(asService(postgres, undefined, () => relay.relay())).resolves.toBe(3);
      expect(publisher.published.map((envelope) => envelope.id).sort()).toEqual([
        "evt_acme2",
        "evt_globex2",
        "evt_platform2",
      ]);
      expect(await superuser("select id from outbox.messages")).toEqual([]);
    });
  });

  describe("deliveries", () => {
    it("leases every owner's delivery and moves its lease, while a session with no owner sees only the platform's", async () => {
      await seedDelivery("dlv_acme", ACME);
      await seedDelivery("dlv_globex", GLOBEX);
      await seedDelivery("dlv_platform", null);
      expect(await idsAs(undefined, "select id from outbox.deliveries")).toEqual(["dlv_platform"]);
      const driver = new PostgresDeliveryDriver(postgres.database);
      const until = new Date(Date.now() + 60_000);
      const leased = await asService(postgres, undefined, () =>
        driver.lease(new Date(), 10, until),
      );
      expect(leased.map((claim) => [claim.id, claim.ownerId]).sort()).toEqual([
        ["dlv_acme", ACME],
        ["dlv_globex", GLOBEX],
        ["dlv_platform", undefined],
      ]);
      expect(
        await superuser("select id from outbox.deliveries where available_at = ?", [until]),
      ).toHaveLength(3);
      await expect(
        asService(postgres, GLOBEX, () => driver.load("dlv_acme")),
      ).resolves.toBeUndefined();
      const written = (await asService(postgres, undefined, () =>
        postgres.database
          .em()
          .execute("update outbox.deliveries set attempts = 5 where id = 'dlv_acme'", [], "run"),
      )) as { affectedRows?: number };
      expect(written.affectedRows ?? 0).toBe(0);
    });

    it("records each outcome in the delivery's owner", async () => {
      const driver = new PostgresDeliveryDriver(postgres.database);
      const failure = { code: "http_status", status: 503 };
      await asService(postgres, undefined, async () => {
        await inRowOwner(isolation, OUTBOX_ACTOR_ID, ACME, "dlv_acme", () =>
          driver.remove("dlv_acme"),
        );
        await inRowOwner(isolation, OUTBOX_ACTOR_ID, GLOBEX, "dlv_globex", () =>
          driver.retry("dlv_globex", new Date(), failure),
        );
        await inRowOwner(isolation, OUTBOX_ACTOR_ID, undefined, "dlv_platform", () =>
          driver.deadLetter("dlv_platform", failure, new Date()),
        );
      });
      expect(
        await superuser(
          "select id, attempts, dead_at is not null as dead from outbox.deliveries order by id",
        ),
      ).toEqual([
        { id: "dlv_globex", attempts: 1, dead: false },
        { id: "dlv_platform", attempts: 1, dead: true },
      ]);
    });

    it("lists and replays every owner's deliveries from the operator's commands, loading each in its owner", async () => {
      const driver = new PostgresDeliveryDriver(postgres.database);
      const bound = {
        has: (type: unknown) => type === CallIsolation,
        get: () => isolation,
      } as unknown as Container;
      const container = () => ({
        get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
          Reflect.construct(
            type,
            type === (RelayReplayCommand as unknown)
              ? [driver, new SystemClock(), bound]
              : [driver, bound],
          ) as T,
        close: async () => {},
      });
      const listed = await runCommandForTest(
        [RelayDeliveriesCommand],
        ["outbox:relay-deliveries"],
        {
          container,
        },
      );
      expect(listed.exitCode).toBe(0);
      expect(listed.stdout).toContain("dlv_globex");
      expect(listed.stdout).toContain("dlv_platform");
      const replayed = await runCommandForTest(
        [RelayReplayCommand],
        ["outbox:relay-replay", "dlv_platform"],
        { container },
      );
      expect(replayed.exitCode).toBe(0);
      expect(await superuser("select id from outbox.deliveries where dead_at is not null")).toEqual(
        [],
      );
    });
  });

  describe("the change log", () => {
    it("claims every owner's change and loads each owner's in its owner; a partition read directly is not open", async () => {
      await seedChange("ord_acme", ACME, NOW);
      await seedChange("ord_globex", GLOBEX, NOW);
      await seedChange("ord_platform", null, NOW);
      const feed = new PostgresChangeFeedDriver(postgres.database);
      const claims = await eventually<readonly ChangeClaim[]>(
        () => asService(postgres, undefined, () => feed.claim(undefined, ["Order"], 10)),
        (value) => value.length === 3,
      );
      expect(claims.map((claim) => claim.ownerId)).toEqual([ACME, GLOBEX, undefined]);
      const records = await asService(postgres, undefined, () =>
        loadChanges(feed, isolation, claims),
      );
      expect(records.map((record) => record.change.id)).toEqual([
        "ord_acme",
        "ord_globex",
        "ord_platform",
      ]);
      await expect(
        asService(postgres, undefined, () => loadChanges(feed, undefined, claims)),
      ).rejects.toBeInstanceOf(RowIsolationMissingError);
      const ordersAs = async (owner: string | undefined, table: string) =>
        (
          (await asService(postgres, owner, () =>
            postgres.database.em().execute(`select data->>'id' as id from ${table} order by seq`),
          )) as { id: string }[]
        ).map((row) => row.id);
      expect(await ordersAs(undefined, "outbox.changes")).toEqual(["ord_platform"]);
      expect(await ordersAs(undefined, "outbox.changes_default")).toEqual(["ord_platform"]);
      expect(await ordersAs(ACME, "outbox.changes_default")).toEqual(["ord_acme", "ord_platform"]);
    });

    it("positions a replay across every owner's entries", async () => {
      const feed = new PostgresChangeFeedDriver(postgres.database);
      const position = await asService(postgres, undefined, () =>
        feed.positionAt(new Date(NOW.getTime() - 1000)),
      );
      const claims = await asService(postgres, undefined, () =>
        feed.claim(position, ["Order"], 10),
      );
      expect(claims).toHaveLength(3);
    });

    it("deletes expired default-partition rows per owner and makes partitions under the log's row security", async () => {
      const old = new Date(NOW.getTime() - 3 * DAY);
      await seedChange("ord_old_acme", ACME, old);
      await seedChange("ord_old_globex", GLOBEX, old);
      await seedChange("ord_old_platform", null, old);
      const feed = new PostgresChangeFeedDriver(postgres.database);
      const report = await asService(postgres, undefined, () =>
        maintainChangeLog(feed, new Date(), Duration.days(1), isolation),
      );
      expect(report.created).toBe(3);
      expect(
        await superuser("select seq from outbox.changes where occurred_at < ?", [
          new Date(Date.now() - DAY),
        ]),
      ).toEqual([]);
      expect(await superuser("select seq from outbox.changes")).toHaveLength(3);
      const tomorrow = new Date(Date.now() + DAY);
      const name = `changes_p${tomorrow.toISOString().slice(0, 10).replaceAll("-", "")}`;
      expect(
        await superuser(
          "select relrowsecurity as enabled, relforcerowsecurity as forced from pg_class where oid = ?::regclass",
          [`outbox.${name}`],
        ),
      ).toEqual([{ enabled: true, forced: true }]);
      expect(
        (
          await superuser(
            "select polname from pg_policy where polrelid = ?::regclass order by polname",
            [`outbox.${name}`],
          )
        ).map((row) => row["polname"]),
      ).toEqual([
        `pol_${name}_tenant_id`,
        `pol_${name}_tenant_id_write_delete`,
        `pol_${name}_tenant_id_write_update`,
      ]);
      await seedChange("ord_next_acme", ACME, tomorrow);
      await seedChange("ord_next_globex", GLOBEX, tomorrow);
      const direct = async (owner: string | undefined) =>
        (
          (await asService(postgres, owner, () =>
            postgres.database.em().execute(`select data->>'id' as id from outbox.${name}`),
          )) as { id: string }[]
        ).map((row) => row.id);
      expect(await direct(undefined)).toEqual([]);
      expect(await direct(ACME)).toEqual(["ord_next_acme"]);
    });
  });

  describe("the replica log", () => {
    it("numbers one partition across owners with no collision, and shows each owner only its own rows", async () => {
      const log = new PostgresReplicaLogDriver(postgres.database);
      const append = (owner: string, id: string, path: string) =>
        asService(postgres, owner, () =>
          log.append(
            "sales.sale.recent@1|",
            [{ id, row: { id, at: new Date(), data: { owner } } }],
            { id: owner as `scp_${string}`, path },
          ),
        );
      await expect(append(ACME, "sal_acme", "platform.alpha.acme")).resolves.toBe(1);
      await expect(append(GLOBEX, "sal_globex", "platform.alpha.globex")).resolves.toBe(2);
      await expect(append(ACME, "sal_acme2", "platform.alpha.acme")).resolves.toBe(3);
      const read = async (owner: string | undefined) =>
        (
          await asService(postgres, owner, () => log.read("sales.sale.recent@1|", 0, 10, undefined))
        )?.changes.map((change) => change.id);
      expect(await read(ACME)).toEqual(["sal_acme", "sal_acme2"]);
      expect(await read(GLOBEX)).toEqual(["sal_globex"]);
      expect(await read(undefined)).toEqual([]);
      expect(
        await superuser("select position, tenant_id from outbox.replica_changes order by position"),
      ).toEqual([
        { position: "1", tenant_id: ACME },
        { position: "2", tenant_id: GLOBEX },
        { position: "3", tenant_id: ACME },
      ]);
    });
  });
});

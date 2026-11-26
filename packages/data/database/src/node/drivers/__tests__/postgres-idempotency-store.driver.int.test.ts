/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresIdempotencyStoreDriver` on real Postgres: a free key is claimed once and a
 *          concurrent claim sees it held, a completed key replays its output, a released key may run again, an
 *          expired key is claimed afresh, and a key claimed and completed inside an outer transaction whose commit
 *          fails is gone, so the retry runs again instead of replaying; a held key lapses after its lease while a
 *          completed one keeps its window, and a late completion lands on a lapsed key but never over another call's
 *          claim. Through the action pipeline (STA-2797), with and without a call isolation: a completion that fails
 *          rolls the action's row back with it, and a failure after the commit leaves the key done, so the retry
 *          replays and the row is written once.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0002 migration creates the table.
 *           The pipeline runs with an allow-all access control, the database unit of work and, for the isolation
 *           case, a stand-in that opens one database transaction (the tenancy driver does that and more).
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 3); ADR 0396 (decision 2); ADR 0022; ADR 0269; ADR 0495 (note of 2026-11-26).
 */
import { Action, ActionPipeline, Idempotency } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import {
  AccessControl,
  CallIsolation,
  IdempotencyStore,
  ReplicaReads,
  UnitOfWork,
} from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { type Actor, ActorKind, Duration, Realm } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { AddIdempotencyRefusalMigration } from "#node/database/migrations/0008-add-idempotency-refusal.migration";
import { CreateActionStoreTablesMigration } from "#node/database/migrations/0002-create-action-store-tables.migration";
import { DatabaseUnitOfWorkDriver } from "#node/drivers/database-unit-of-work.driver";
import { PostgresIdempotencyStoreDriver } from "#node/drivers/postgres-idempotency-store.driver";
import { usePostgres } from "#testing/use-postgres";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateActionStoreTablesMigration, { schema: "database", createsSchema: true }),
    compileMigration(AddIdempotencyRefusalMigration, { schema: "database" }),
  ],
});

/** The store over the test database. */
const store = () => new PostgresIdempotencyStoreDriver(postgres.database);

describe(PostgresIdempotencyStoreDriver, () => {
  it("claims a free key once; a concurrent claim sees it held", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => store().claim("a:-:usr_1:k1", "f1", Duration.hours(24))),
    );
    expect(results.filter((result) => result === undefined)).toHaveLength(1);
    expect(results.filter((result) => result !== undefined)).toEqual(
      Array.from({ length: 4 }, () => ({ fingerprint: "f1", done: false })),
    );
  });

  it("replays a completed key's output", async () => {
    await store().claim("a:-:usr_1:k2", "f2", Duration.hours(24));
    await store().complete("a:-:usr_1:k2", "f2", { orderId: "ord_1" }, Duration.hours(24));
    expect(await store().claim("a:-:usr_1:k2", "f2", Duration.hours(24))).toEqual({
      fingerprint: "f2",
      done: true,
      output: { orderId: "ord_1" },
    });
  });

  it("lets a released key run again, and claims an expired key afresh", async () => {
    await store().claim("a:-:usr_1:k3", "f3", Duration.hours(24));
    await store().release("a:-:usr_1:k3");
    expect(await store().claim("a:-:usr_1:k3", "f3", Duration.hours(24))).toBeUndefined();
    await store().claim("a:-:usr_1:k4", "f4", Duration.seconds(0.001));
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(await store().claim("a:-:usr_1:k4", "other", Duration.hours(24))).toBeUndefined();
  });

  it("runs a retry again when the outer transaction it completed in fails to commit", async () => {
    const em = () => postgres.database.em();
    // raw-sql: a deferred unique constraint, checked only at commit, so the commit itself fails
    await em().execute(
      "create table if not exists public.commit_probe (id int, constraint uq_commit_probe unique (id) deferrable initially deferred)",
    );
    const call = async () => {
      expect(await store().claim("a:-:usr_1:k5", "f5", Duration.hours(24))).toBeUndefined();
      // raw-sql: two equal rows: allowed until the deferred check runs at commit
      await em().execute("insert into public.commit_probe (id) values (1), (1)");
      await store().complete("a:-:usr_1:k5", "f5", { orderId: "ord_5" }, Duration.hours(24));
    };
    await expect(postgres.database.transaction(call)).rejects.toThrow();
    // the claim and the completion rolled back with the outer commit: the retry runs, it does not replay
    expect(await store().claim("a:-:usr_1:k5", "f5", Duration.hours(24))).toBeUndefined();
  });

  it("keeps a refusal recorded after the call's transaction rolled back, and replays it", async () => {
    const refusal = {
      kind: ErrorKind.Conflict,
      code: "out_of_stock",
      category: "conflict",
      retryable: false,
      details: { sku: "a" },
    } as const;
    const call = async () => {
      expect(await store().claim("a:-:usr_1:k6", "f6", Duration.hours(24))).toBeUndefined();
      throw new Error("refused");
    };
    await expect(postgres.database.transaction(call)).rejects.toThrow("refused");
    // the claim rolled back with the call, so the refusal is an insert, not an update
    await store().completeRefused("a:-:usr_1:k6", "f6", refusal, Duration.hours(24));
    expect(await store().claim("a:-:usr_1:k6", "f6", Duration.hours(24))).toEqual({
      fingerprint: "f6",
      done: true,
      refusal,
    });
    // a held key becomes the refusal too
    await store().claim("a:-:usr_1:k7", "f7", Duration.hours(24));
    await store().completeRefused("a:-:usr_1:k7", "f7", refusal, Duration.hours(24));
    expect(await store().claim("a:-:usr_1:k7", "f7", Duration.hours(24))).toMatchObject({
      done: true,
      refusal,
    });
  });
});

/** Waits `ms` milliseconds of real time, for an expiry Postgres reads from its own clock. */
const pause = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe("PostgresIdempotencyStoreDriver lease and window (STA-2797)", () => {
  it("frees a held key after its lease, but keeps a completed key for its window", async () => {
    await store().claim("a:-:usr_1:l1", "f", Duration.seconds(0.05));
    await store().claim("a:-:usr_1:l2", "f", Duration.seconds(0.05));
    await store().complete("a:-:usr_1:l2", "f", { orderId: "ord_l2" }, Duration.hours(24));
    await pause(120);
    expect(await store().claim("a:-:usr_1:l1", "f", Duration.minutes(15))).toBeUndefined();
    expect(await store().claim("a:-:usr_1:l2", "f", Duration.minutes(15))).toEqual({
      fingerprint: "f",
      done: true,
      output: { orderId: "ord_l2" },
    });
  });

  it("lands a late completion on a lapsed key, never over another call's claim or a done key", async () => {
    await store().claim("a:-:usr_1:l3", "f", Duration.seconds(0.05));
    await pause(120);
    await store().complete("a:-:usr_1:l3", "f", 1, Duration.hours(24));
    expect(await store().claim("a:-:usr_1:l3", "f", Duration.minutes(15))).toMatchObject({
      done: true,
      output: 1,
    });
    await store().claim("a:-:usr_1:l4", "other", Duration.minutes(15));
    await store().complete("a:-:usr_1:l4", "f", 2, Duration.hours(24));
    expect(await store().claim("a:-:usr_1:l4", "f", Duration.minutes(15))).toEqual({
      fingerprint: "other",
      done: false,
    });
    await store().complete("a:-:usr_1:l4", "other", 3, Duration.hours(24));
    await store().complete("a:-:usr_1:l4", "other", 4, Duration.hours(24));
    await store().release("a:-:usr_1:l4");
    expect(await store().claim("a:-:usr_1:l4", "other", Duration.minutes(15))).toMatchObject({
      done: true,
      output: 3,
    });
  });
});

/** Allows every call: the permission step is not what these tests prove. */
class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

/** Opens one database transaction per call, as the tenancy driver does (without its settings). */
class TransactionIsolation extends Driver(CallIsolation) {
  async run<T>(_actor: Actor, _scope: unknown, work: () => Promise<T>): Promise<T> {
    return postgres.database.transaction(work);
  }
}

/** A read-your-writes mark that fails once: anything that breaks after the call committed (a crash). */
class BrokenAfterCommit extends Driver(ReplicaReads) {
  broken = false;

  async onReplica<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  async wrote(): Promise<void> {
    if (!this.broken) return;
    this.broken = false;
    throw new Error("crashed after the commit");
  }

  async pinned(): Promise<boolean> {
    return true;
  }
}

/** Writes one order row; with `unkeepable` its output cannot be stored, so the completion fails. */
class PlaceOrderAction extends Action({
  key: "order.place",
  actors: [ActorKind.User],
  idempotency: Idempotency.Required,
}) {
  unkeepable = false;

  async handle(input: { id: string }): Promise<{ id: string; extra?: bigint }> {
    // raw-sql: the action's own write, in its unit of work
    await postgres.database
      .em()
      .execute("insert into public.placed_orders (id) values (?)", [input.id]);
    return this.unkeepable ? { id: input.id, extra: 1n } : { id: input.id };
  }
}

const buyer: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer, scopeId: "ten_1" };

/** The rows of `placed_orders` with `id`. */
const placed = async (id: string): Promise<number> =>
  (
    (await postgres.database
      .em()
      .execute("select count(*)::int as n from public.placed_orders where id = ?", [id])) as {
      n: number;
    }[]
  )[0]?.n ?? 0;

/** A pipeline over the test database, with or without a call isolation. */
function pipelineOf(isolated: boolean) {
  const action = new PlaceOrderAction();
  const after = new BrokenAfterCommit();
  const bound = new Map<AnyClass, object>([
    [AccessControl, new AllowAll()],
    [UnitOfWork, new DatabaseUnitOfWorkDriver()],
    [IdempotencyStore, store()],
    [ReplicaReads, after],
    [PlaceOrderAction, action],
    ...(isolated ? [[CallIsolation, new TransactionIsolation()] as const] : []),
  ]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <U extends object>(type: AnyClass<U>) => bound.get(type) as U,
  };
  const pipeline = new ActionPipeline(resolver);
  const place = (id: string, key: string) =>
    pipeline.execute(PlaceOrderAction, { id }, { actor: buyer, idempotencyKey: key });
  return { action, after, place };
}
describe("the action pipeline on the Postgres store (STA-2797)", () => {
  beforeAll(async () => {
    // raw-sql: the table the test action writes
    await postgres.database
      .em()
      .execute("create table if not exists public.placed_orders (id text)");
  });

  for (const isolated of [true, false]) {
    const how = isolated ? "inside a call isolation" : "with no isolation bound";

    it(`rolls the order back when the completion fails, so the retry runs once (${how})`, async () => {
      const id = `ord_fail_${isolated}`;
      const { action, place } = pipelineOf(isolated);
      action.unkeepable = true;
      await expect(place(id, `k-fail-${isolated}`)).rejects.toThrow(/BigInt/);
      expect(await placed(id)).toBe(0);
      action.unkeepable = false;
      expect(await place(id, `k-fail-${isolated}`)).toEqual({ id });
      expect(await place(id, `k-fail-${isolated}`)).toEqual({ id });
      expect(await placed(id)).toBe(1);
    });

    it(`replays a committed order after a failure that follows the commit (${how})`, async () => {
      const id = `ord_crash_${isolated}`;
      const { after, place } = pipelineOf(isolated);
      after.broken = true;
      await expect(place(id, `k-crash-${isolated}`)).rejects.toThrow("crashed after the commit");
      // the key was done in the same commit as the row: the retry replays, it never places a second order
      expect(await place(id, `k-crash-${isolated}`)).toEqual({ id });
      expect(await placed(id)).toBe(1);
    });
  }
});

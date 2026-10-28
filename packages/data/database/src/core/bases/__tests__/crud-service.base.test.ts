/**
 * Stackra file contract:
 * Purpose: unit tests of `CrudService` (with the delete policy: soft delete, archive, restore, force delete and the
 *          hidden-row read options): the model comes from the registered partner (and an unregistered service
 *          says so), every read and write goes to the running context's entity manager with `$raw` turned into a raw
 *          key, `findOneOrFail` refuses with `not_found`, `insert` flushes in a savepoint or its own transaction,
 *          `update` assigns (now, in its own transaction, with `requiresNew`), `lock` reads again under a pessimistic
 *          write lock (shared, nowait or skip-locked on request), `increment` adds in one parameterised statement, `table` builds the cursor read (a multi-key sort, operator filters, a refused fourth key or unknown operator), `sum` and `countDistinct` aggregate, and `metrics` returns a reader. With a
 *          `VisibilityFilter` bound, every read ANDs its conditions for the running call's actor (none outside a
 *          call), and a read with no conditions or no driver is unchanged. With a `HoldRegistry`
 *          connected, `purge` removes only the rows no hold covers, telling it each row's registered subject links. `repath` rewrites a subtree's path prefix in one
 *          parameterised statement and refuses a path that is not `ltree` or a move under itself. With a
 *          `NativeWriteWatcher` connected that watches the model, the native verbs read the matching ids first, narrow
 *          the statement to them and report them; a model it does not watch is written as before. An `AppendOnly`
 *          model refuses `update`, `increment`, `delete`, `restore` and `repath`, and still inserts and purges.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0307 (rules 2 and 16); ADR 0333 (decision 4); ADR 0022;
 *                     ADR 0269.
 */
import { LockMode, TransactionPropagation } from "@mikro-orm/core";
import type { OptionalProps } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";
import { ContextStorage } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ActorKind, Realm, SortDirection } from "@stackra/contracts";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { AppendOnly, Archivable, HasPublicId, Model, SoftDeletes } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CrudService } from "#core/bases/crud-service.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { connectHoldRegistry } from "#core/functions/connect-hold-registry.function";
import { connectNativeWriteWatcher } from "#core/functions/connect-native-write-watcher.function";
import type { NativeWrite } from "#core/types/native-write.type";
import { AppendOnlyWriteError } from "#core/errors/append-only-write.error";
import { StaleVersionError } from "#core/errors/stale-version.error";
import { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";
import { registerHoldLinks } from "#core/functions/register-hold-links.function";
import { registerModelPartners } from "#core/functions/register-model-partners.function";
import { sql } from "#core/functions/sql.function";
import { Database } from "#core/ports/database.port";
import { Disposal } from "#contracts/enums/disposal.enum";
import { HoldRegistry } from "#contracts/ports/hold-registry.port";
import type { HoldLinks } from "#contracts/types/hold-links.type";
import { VisibilityFilter } from "#contracts/ports/visibility-filter.port";
import { MetricsReader } from "#core/values/metrics-reader.value";

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the generated [OptionalProps] augmentation below
class Order extends Model.with(HasPublicId("ord")) {
  status = "pending";

  createdAt = new Date();
}

// The generated `[OptionalProps]` augmentation: fields with initializers may be left out of `create`.
interface Order {
  [OptionalProps]?: "id" | "status" | "createdAt";
}

class OrderService extends CrudService<Order> {}

class OrphanService extends CrudService<Order> {}

class LedgerEntry extends Model.with(HasPublicId("lpe"), AppendOnly) {}

class LedgerEntryService extends CrudService<LedgerEntry> {}

/** Whether `error` is the append-only refusal. */
const refused = (error: unknown): boolean => isRefusal(error, AppendOnlyWriteError);

registerModelPartners([
  [OrderService, Order],
  [LedgerEntryService, LedgerEntry],
]);

const metadata = {
  className: "Order",
  primaryKeys: ["id"],
  properties: {
    id: { fieldNames: ["id"] },
    createdAt: { fieldNames: ["created_at"] },
    scopePath: { fieldNames: ["scope_path"] },
    hits: { fieldNames: ["hits"] },
  },
};

/** A recording entity manager. */
function fakeEm() {
  const builder = {
    select: vi.fn(() => builder),
    where: vi.fn(() => builder),
    andWhere: vi.fn(() => builder),
    execute: vi.fn(async () => ({ total: "42" })),
  };
  const em = {
    builder,
    find: vi.fn(async (..._args: unknown[]) => [] as unknown[]),
    findOne: vi.fn(async () => null),
    findOneOrFail: vi.fn(async (..._args: unknown[]) => new Order()),
    count: vi.fn(async () => 3),
    create: vi.fn((_model: unknown, data: object) => Object.assign(new Order(), data)),
    flush: vi.fn(async () => undefined),
    assign: vi.fn((row: object, data: object) => Object.assign(row, data)),
    nativeDelete: vi.fn(async () => 2),
    nativeUpdate: vi.fn(async (..._args: unknown[]) => 4),
    getMetadata: vi.fn(() => metadata),
    createQueryBuilder: vi.fn(() => builder),
    findByCursor: vi.fn(async () => ({
      items: [new Order()],
      hasNextPage: true,
      endCursor: "c2",
    })),
    transactional: vi.fn(async (work: (em: unknown) => Promise<unknown>, _options?: unknown) =>
      work(em),
    ),
  };
  return em;
}

/** A database whose entity manager is `em`. */
class FakeDatabase extends Database {
  private readonly manager: EntityManager;

  constructor(manager: EntityManager) {
    super();
    this.manager = manager;
  }

  em(): EntityManager {
    return this.manager;
  }

  transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

/** Connects a fake database and returns its entity manager. */
function connect() {
  const em = fakeEm();
  ACTIVE_DATABASE.current = new FakeDatabase(em as unknown as EntityManager);
  return em;
}

/** The caller of the running call in the visibility tests. */
const actor = { kind: ActorKind.User, id: "usr_01ja0000000000000000000001", realm: Realm.Customer };

/** A seven-day period and the one before it. */
const period = {
  from: new Date("2026-10-01T00:00:00Z"),
  to: new Date("2026-10-08T00:00:00Z"),
  days: 7,
  previous: { from: new Date("2026-09-24T00:00:00Z"), to: new Date("2026-10-01T00:00:00Z") },
};

/** Connects a resolver binding a visibility driver that returns `conditions`, and a context storage holding `context`. */
function connectVisibility(conditions: object, context: object | undefined) {
  const conditionsFor = vi.fn(async (_model: unknown, _principal: unknown) => conditions);
  const filter = { conditionsFor } as unknown as VisibilityFilter;
  const storage = { current: () => context } as unknown as ContextStorage;
  connectVisibilityFilter({
    has: (token) => token === VisibilityFilter || token === ContextStorage,
    get: (token) => (token === VisibilityFilter ? filter : storage) as never,
  });
  return conditionsFor;
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
  connectVisibilityFilter(undefined);
});

describe(CrudService, () => {
  it("reads through the running entity manager, with $raw as a raw key", async () => {
    const em = connect();
    const raw = sql`created_at < ${new Date(0)}`;
    await new OrderService().find({ status: "paid", $raw: raw }, { limit: 5 });
    expect(em.find).toHaveBeenCalledWith(Order, { status: "paid", [raw.key]: [] }, { limit: 5 });
    expect(await new OrderService().count({ status: "paid" })).toBe(3);
    expect(await new OrderService().purge({ status: "paid" })).toBe(2);
  });

  it("refuses with not_found through findOneOrFail", async () => {
    const em = connect();
    await new OrderService().findOneOrFail({ id: "ord_1" });
    const options = em.findOneOrFail.mock.calls[0]?.[2] as { failHandler: () => Error };
    expect(isRefusal(options.failHandler(), NotFoundError)).toBe(true);
  });

  it("creates in the unit of work, inserts now, and updates by assignment", async () => {
    const em = connect();
    const service = new OrderService();
    expect(service.create({ status: "paid" }).status).toBe("paid");
    await service.insert({ status: "paid" });
    await service.insert({ status: "paid" }, { requiresNew: true });
    expect(em.transactional.mock.calls.map((call) => call[1])).toEqual([
      { propagation: TransactionPropagation.NESTED },
      { propagation: TransactionPropagation.REQUIRES_NEW },
    ]);
    expect(em.flush).toHaveBeenCalledTimes(2);
    const updated = await service.update({ id: "ord_1" }, { status: "cancelled" });
    expect(updated.status).toBe("cancelled");
  });

  it("refuses an update whose expected version the row moved past, before changing it", async () => {
    const em = connect();
    const service = new OrderService();
    em.findOneOrFail.mockResolvedValueOnce(Object.assign(new Order(), { version: 3 }));
    await expect(
      service.update({ id: "ord_1" }, { status: "cancelled" }, { expectedVersion: 2 }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, StaleVersionError));
    expect(em.assign).not.toHaveBeenCalled();
    em.findOneOrFail.mockResolvedValueOnce(Object.assign(new Order(), { version: 3 }));
    const updated = await service.update(
      { id: "ord_1" },
      { status: "paid" },
      { expectedVersion: 3 },
    );
    expect(updated.status).toBe("paid");
  });

  it("refuses every change of an append-only row and still inserts and purges", async () => {
    const em = connect();
    const service = new LedgerEntryService();
    await expect(service.update({ id: "lpe_1" }, {})).rejects.toSatisfy(refused);
    expect(em.findOneOrFail).not.toHaveBeenCalled();
    for (const write of [
      () => service.increment({ id: "lpe_1" }, "hits"),
      () => service.delete({ id: "lpe_1" }),
      () => service.restore({ id: "lpe_1" }),
    ])
      expect(write).toThrow(AppendOnlyWriteError);
    await expect(service.repath("platform.a", "platform.b")).rejects.toSatisfy(refused);
    expect(em.nativeUpdate).not.toHaveBeenCalled();
    await service.insert({} as never);
    expect(await service.purge({ id: "lpe_1" })).toBe(2);
  });

  it("reads one table page by cursor, the sort then the primary key", async () => {
    const em = connect();
    const page = await new OrderService().table(
      {
        limit: 20,
        cursor: "c1",
        sort: { key: "createdAt", direction: SortDirection.Asc },
        filter: { status: ["paid", "pending"], ignored: undefined },
      },
      { where: { id: { $ne: "ord_0" } } },
    );
    expect(em.findByCursor).toHaveBeenCalledWith(Order, {
      where: { $and: [{ id: { $ne: "ord_0" } }, { status: { $in: ["paid", "pending"] } }] },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      first: 20,
      after: "c1",
      includeCount: false,
    });
    expect(page).toMatchObject({ hasMore: true, nextCursor: "c2" });
    expect(page.items).toHaveLength(1);
  });

  it("reads a multi-key sort and compiles operator filters, refusing a fourth key", async () => {
    const em = connect();
    await new OrderService().table(
      {
        limit: 20,
        sort: [
          { key: "status", direction: SortDirection.Asc },
          { key: "createdAt", direction: SortDirection.Desc },
        ],
        filter: {
          createdAt: { op: "dateRange", from: "2026-10-01", to: "2026-10-01" },
          status: { op: "ne", value: "void" },
        },
      },
      { where: { id: { $ne: "ord_0" } } },
    );
    expect(em.findByCursor).toHaveBeenLastCalledWith(Order, {
      where: {
        $and: [
          { id: { $ne: "ord_0" } },
          {
            createdAt: {
              $gte: new Date("2026-10-01T00:00:00Z"),
              $lt: new Date("2026-10-02T00:00:00Z"),
            },
          },
          { status: { $ne: "void" } },
        ],
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "asc" }],
      first: 20,
      includeCount: false,
    });
    const keys = ["status", "createdAt", "id", "hits"].map((key) => ({
      key,
      direction: SortDirection.Asc,
    }));
    await expect(new OrderService().table({ limit: 20, sort: keys })).rejects.toMatchObject({
      code: "table_filter_invalid",
    });
    await expect(
      new OrderService().table({ limit: 20, filter: { status: { $like: "%" } } }),
    ).rejects.toMatchObject({ code: "table_filter_invalid" });
  });

  it("sums a field and hands metrics to a reader", async () => {
    const em = connect();
    expect(await new OrderService().sum("createdAt")).toBe(42);
    expect(em.builder.select).toHaveBeenCalledTimes(1);
    expect(new OrderService().metrics(period, { on: "createdAt" })).toBeInstanceOf(MetricsReader);
  });

  it("counts the distinct values of a field", async () => {
    const em = connect();
    expect(await new OrderService().countDistinct("createdAt", { status: "paid" })).toBe(42);
    const [selected] = em.builder.select.mock.calls[0] as unknown as [{ sql: string }];
    expect(selected.sql).toBe('count(distinct row."created_at") as total');
    expect(em.builder.where).toHaveBeenCalledWith({ status: "paid" });
  });

  it("names the service whose model gen has not registered", async () => {
    connect();
    await expect(new OrphanService().find({})).rejects.toThrow(
      /No model is registered for OrphanService/,
    );
  });

  it("ANDs the bound visibility conditions into every read, for the running call's actor", async () => {
    const em = connect();
    const conditionsFor = connectVisibility({ status: "visible" }, { actor });
    const service = new OrderService();
    const visible = { $and: [{ status: "paid" }, { status: "visible" }] };
    await service.find({ status: "paid" });
    expect(em.find).toHaveBeenLastCalledWith(Order, visible, undefined);
    await service.findOne({ status: "paid" });
    expect(em.findOne).toHaveBeenLastCalledWith(Order, visible, undefined);
    await service.findOneOrFail({ status: "paid" });
    expect(em.findOneOrFail.mock.calls[0]?.[1]).toEqual(visible);
    await service.count({ status: "paid" });
    expect(em.count).toHaveBeenLastCalledWith(Order, visible);
    await service.sum("createdAt", { status: "paid" });
    expect(em.builder.where).toHaveBeenLastCalledWith(visible);
    await service.table({ limit: 5 }, { where: { status: "paid" } });
    expect(em.findByCursor).toHaveBeenLastCalledWith(
      Order,
      expect.objectContaining({ where: { $and: [visible] } }),
    );
    await service.metrics(period, { on: "createdAt", where: { status: "paid" } }).count();
    expect(em.builder.where).toHaveBeenLastCalledWith(visible);
    expect(conditionsFor).toHaveBeenCalledTimes(7);
    expect(conditionsFor).toHaveBeenCalledWith(Order, actor);
  });

  it("passes no principal outside a call, and leaves a read alone without conditions or a driver", async () => {
    const em = connect();
    const conditionsFor = connectVisibility({}, undefined);
    await new OrderService().find({ status: "paid" });
    expect(conditionsFor).toHaveBeenCalledWith(Order, undefined);
    expect(em.find).toHaveBeenLastCalledWith(Order, { status: "paid" }, undefined);
    connectVisibilityFilter({
      has: () => false,
      get: () => {
        throw new Error("nothing is bound");
      },
    });
    expect(await new OrderService().count({ status: "paid" })).toBe(3);
    expect(em.count).toHaveBeenLastCalledWith(Order, { status: "paid" });
  });
});

/** A registry holding `ord_2`, recording what it was asked. */
function registry() {
  const asked: unknown[][] = [];
  class Holds extends Driver(HoldRegistry) {
    async heldAmong<M extends object>(
      model: AnyClass<M>,
      ids: readonly string[],
      disposal: Disposal,
      links?: HoldLinks,
    ): Promise<ReadonlySet<string>> {
      asked.push(
        links === undefined ? [model, [...ids], disposal] : [model, [...ids], disposal, links],
      );
      return new Set(ids.filter((id) => id === "ord_2"));
    }
  }
  return { holds: new Holds(), asked };
}

describe("CrudService.purge with legal holds", () => {
  afterEach(() => {
    connectHoldRegistry(undefined);
  });

  it("removes only the matching rows no hold covers", async () => {
    const em = connect();
    em.find.mockResolvedValueOnce([{ id: "ord_1" }, { id: "ord_2" }] as never);
    const { holds, asked } = registry();
    connectHoldRegistry(holds);
    expect(await new OrderService().purge({ status: "paid" })).toBe(2);
    expect(asked).toEqual([[Order, ["ord_1", "ord_2"], Disposal.Purge]]);
    expect(em.nativeDelete).toHaveBeenCalledWith(
      Order,
      { $and: [{ status: "paid" }, { id: { $in: ["ord_1"] } }] },
      { filters: { deleted: false, archived: false } },
    );
  });

  it("reads the registered subject links and sends them with the ids (STA-1241)", async () => {
    const em = connect();
    registerHoldLinks([[Order, ["customerId"]]]);
    em.find.mockResolvedValueOnce([
      { id: "ord_1", customerId: "per_7" },
      { id: "ord_2", customerId: null },
    ] as never);
    const { holds, asked } = registry();
    connectHoldRegistry(holds);
    try {
      await new OrderService().purge({ status: "paid" });
    } finally {
      registerHoldLinks([[Order, []]]);
    }
    expect(em.find.mock.calls[0]?.[2]).toEqual({
      fields: ["id", "customerId"],
      filters: { deleted: false, archived: false },
    });
    expect(asked).toEqual([
      [Order, ["ord_1", "ord_2"], Disposal.Purge, { ord_1: { customerId: "per_7" } }],
    ]);
  });

  it("removes nothing when every match is held", async () => {
    const em = connect();
    em.find.mockResolvedValueOnce([{ id: "ord_2" }] as never);
    connectHoldRegistry(registry().holds);
    expect(await new OrderService().purge({ status: "paid" })).toBe(0);
    expect(em.nativeDelete).not.toHaveBeenCalled();
  });
});

describe("CrudService row lock, increment and update requiresNew (STA-1239)", () => {
  it("locks the row for update and reads it again", async () => {
    const em = connect();
    await new OrderService().lock({ id: "ord_1" });
    const options = em.findOneOrFail.mock.calls[0]?.[2] as {
      lockMode: LockMode;
      refresh: boolean;
      failHandler: () => Error;
    };
    expect(options.lockMode).toBe(LockMode.PESSIMISTIC_WRITE);
    expect(options.refresh).toBe(true);
    expect(isRefusal(options.failHandler(), NotFoundError)).toBe(true);
  });

  it("takes a shared, nowait or skip-locked lock, and refuses nowait with skipLocked (stackra-279)", async () => {
    const em = connect();
    const service = new OrderService();
    await service.lock({ id: "ord_1" }, { shared: true });
    await service.lock({ id: "ord_1" }, { nowait: true });
    await service.lock({ id: "ord_1" }, { nowait: true, shared: true });
    const modes = em.findOneOrFail.mock.calls.map(
      (call) => (call[2] as { lockMode: LockMode }).lockMode,
    );
    expect(modes).toEqual([
      LockMode.PESSIMISTIC_READ,
      LockMode.PESSIMISTIC_WRITE_OR_FAIL,
      LockMode.PESSIMISTIC_READ_OR_FAIL,
    ]);
    expect(await service.lock({ status: "pending" }, { skipLocked: true })).toBeNull();
    await service.lock({ status: "pending" }, { skipLocked: true, shared: true });
    expect(em.findOne.mock.calls.map((call) => (call as unknown[])[2])).toEqual([
      { lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE, refresh: true },
      { lockMode: LockMode.PESSIMISTIC_PARTIAL_READ, refresh: true },
    ]);
    expect(() => service.lock({ id: "ord_1" }, { nowait: true, skipLocked: true })).toThrow(
      TypeError,
    );
  });

  it("increments a field in one statement, the step a parameter", async () => {
    const em = connect();
    expect(await new OrderService().increment({ id: "ord_1" }, "hits", 3)).toBe(4);
    const [model, , data] = em.nativeUpdate.mock.calls[0] as [
      unknown,
      object,
      { hits: { sql: string; params: unknown[] } },
    ];
    expect(model).toBe(Order);
    expect(data.hits.sql).toBe('"hits" + ?');
    expect(data.hits.params).toEqual([3]);
  });

  it("refuses a step that is not finite, and a field with no column", async () => {
    connect();
    await expect(async () =>
      new OrderService().increment({ id: "ord_1" }, "hits", Number.NaN),
    ).rejects.toThrow(TypeError);
    await expect(async () => new OrderService().increment({ id: "ord_1" }, "nope")).rejects.toThrow(
      TypeError,
    );
  });

  it("updates now in a transaction of its own with requiresNew", async () => {
    const em = connect();
    const updated = await new OrderService().update(
      { id: "ord_1" },
      { status: "failed" },
      { requiresNew: true },
    );
    expect(updated.status).toBe("failed");
    expect(em.transactional.mock.calls[0]?.[1]).toEqual({
      propagation: TransactionPropagation.REQUIRES_NEW,
    });
    expect(em.flush).toHaveBeenCalledTimes(1);
    const options = em.findOneOrFail.mock.calls[0]?.[2] as { failHandler: () => Error };
    expect(isRefusal(options.failHandler(), NotFoundError)).toBe(true);
  });
});

describe("CrudService.repath", () => {
  it("rewrites the prefix of every row at or below the old path in one parameterised statement", async () => {
    const em = connect();
    expect(await new OrderService().repath("platform.a", "platform.b.c")).toBe(4);
    const [model, where, data] = em.nativeUpdate.mock.calls[0] as [
      unknown,
      object,
      { scopePath: { sql: string; params: unknown[] } },
    ];
    expect(model).toBe(Order);
    // the raw condition is a symbol key described as `raw('<sql>')`
    expect(Object.getOwnPropertySymbols(where)[0]?.description).toContain(
      '"scope_path" <@ ?::ltree',
    );
    expect(data.scopePath.sql).toBe('?::ltree || subpath("scope_path", nlevel(?::ltree))');
    expect(data.scopePath.params).toEqual(["platform.b.c", "platform.a"]);
  });

  it("moves nothing when the paths are the same", async () => {
    const em = connect();
    expect(await new OrderService().repath("platform.a", "platform.a")).toBe(0);
    expect(em.nativeUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ["a path that is not ltree", "platform.a", "platform|b"],
    ["a move under itself", "platform.a", "platform.a.b"],
  ])("refuses %s", async (_name, from, to) => {
    connect();
    await expect(new OrderService().repath(from, to)).rejects.toThrow(TypeError);
  });
});

describe("CrudService delete policy (ADR 0134 decision 4)", () => {
  class Note extends Model.with(HasPublicId("not"), SoftDeletes) {}

  class Project extends Model.with(HasPublicId("prj"), Archivable) {}

  class NoteService extends CrudService<Note> {}

  class ProjectService extends CrudService<Project> {}

  registerModelPartners([
    [NoteService, Note],
    [ProjectService, Project],
  ]);

  it("soft-deletes a SoftDeletes model, archives an Archivable one, hard-deletes any other", async () => {
    const em = connect();
    await new NoteService().delete({ id: "not_1" });
    expect(em.nativeUpdate.mock.calls[0]?.[0]).toBe(Note);
    expect(em.nativeUpdate.mock.calls[0]?.[2]).toMatchObject({ deletedAt: expect.any(Date) });
    await new ProjectService().delete({ id: "prj_1" });
    expect(em.nativeUpdate.mock.calls[1]?.[2]).toMatchObject({ archivedAt: expect.any(Date) });
    await new OrderService().delete({ id: "ord_1" });
    expect(em.nativeDelete).toHaveBeenCalledTimes(1);
  });

  it("restores kept rows with the filter off, and refuses a hard-deleted model", async () => {
    const em = connect();
    await new NoteService().restore({ id: "not_1" });
    expect(em.nativeUpdate.mock.calls[0]?.[1]).toEqual({
      $and: [{ id: "not_1" }, { deletedAt: { $ne: null } }],
    });
    expect(em.nativeUpdate.mock.calls[0]?.[2]).toMatchObject({ deletedAt: null });
    expect(em.nativeUpdate.mock.calls[0]?.[3]).toEqual({ filters: { deleted: false } });
    expect(() => new OrderService().restore({ id: "ord_1" })).toThrow(TypeError);
    await new NoteService().forceDelete({ id: "not_1" });
    expect((em.nativeDelete.mock.calls[0] as unknown[] | undefined)?.[2]).toEqual({
      filters: { deleted: false, archived: false },
    });
  });

  it("reads deleted or archived rows only when asked", async () => {
    const em = connect();
    await new NoteService().find({ id: "not_1" }, { limit: 1 });
    expect(em.find.mock.calls[0]?.[2]).toEqual({ limit: 1 });
    await new NoteService().find({ id: "not_1" }, { withDeleted: true });
    expect(em.find.mock.calls[1]?.[2]).toEqual({ filters: { deleted: false } });
    await new NoteService().find({ id: "not_1" }, { onlyDeleted: true });
    expect(em.find.mock.calls[2]?.[1]).toEqual({
      $and: [{ id: "not_1" }, { deletedAt: { $ne: null } }],
    });
    await new ProjectService().count({}, { withArchived: true });
    expect((em.count.mock.calls[0] as unknown[] | undefined)?.[2]).toEqual({
      filters: { archived: false },
    });
  });
});

/** Connects a watcher of `Order` that records what it is told. */
function watch(watches = true) {
  const written: Omit<NativeWrite, "em">[] = [];
  connectNativeWriteWatcher({
    watches: (model) => watches && model === Order,
    written: async ({ em: _em, ...write }) => {
      written.push(write);
    },
  });
  return written;
}

describe("CrudService native writes with a watcher (data-layer gap mo10)", () => {
  afterEach(() => {
    connectNativeWriteWatcher(undefined);
    connectHoldRegistry(undefined);
  });

  it("narrows an increment to the ids it read and reports them", async () => {
    const em = connect();
    em.find.mockResolvedValueOnce([{ id: "ord_1" }, { id: "ord_2" }] as never);
    const written = watch();
    await new OrderService().increment({ status: "paid" }, "hits", 2);
    expect(em.nativeUpdate.mock.calls[0]?.[1]).toEqual({
      $and: [{ status: "paid" }, { id: { $in: ["ord_1", "ord_2"] } }],
    });
    expect(written).toEqual([
      { model: Order, kind: "updated", ids: ["ord_1", "ord_2"], fields: ["hits"] },
    ]);
  });

  it("reports a purge as deleted rows, held ones left out, and skips a write that matched nothing", async () => {
    const em = connect();
    const written = watch();
    em.find.mockResolvedValueOnce([{ id: "ord_3" }] as never);
    await new OrderService().purge({ status: "void" });
    expect(written).toEqual([{ model: Order, kind: "deleted", ids: ["ord_3"], fields: [] }]);
    em.find.mockResolvedValueOnce([] as never);
    expect(await new OrderService().purge({ status: "void" })).toBe(0);
    expect(em.nativeDelete).toHaveBeenCalledTimes(1);
  });

  it("writes an unwatched model as before, without reading ids", async () => {
    const em = connect();
    const written = watch(false);
    await new OrderService().increment({ status: "paid" }, "hits");
    expect(em.find).not.toHaveBeenCalled();
    expect(em.nativeUpdate.mock.calls[0]?.[1]).toEqual({ status: "paid" });
    expect(written).toEqual([]);
  });
});

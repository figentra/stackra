/**
 * Stackra file contract:
 * Purpose: unit tests of `CrudService`: the model comes from the registered partner (and an unregistered service
 *          says so), every read and write goes to the running context's entity manager with `$raw` turned into a raw
 *          key, `findOneOrFail` refuses with `not_found`, `insert` flushes in a savepoint or its own transaction,
 *          `update` assigns, `table` builds the cursor read, `sum` aggregates, and `metrics` returns a reader. With a
 *          `VisibilityFilter` bound, every read ANDs its conditions for the running call's actor (none outside a
 *          call), and a read with no conditions or no driver is unchanged. With a `HoldRegistry`
 *          connected, `purge` removes only the rows no hold covers. `repath` rewrites a subtree's path prefix in one
 *          parameterised statement and refuses a path that is not `ltree` or a move under itself.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0307 (rules 2 and 16); ADR 0333 (decision 4); ADR 0022;
 *                     ADR 0269.
 */
import { TransactionPropagation } from "@mikro-orm/core";
import type { OptionalProps } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";
import { ContextStorage } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ActorKind, Realm, SortDirection } from "@stackra/contracts";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { HasPublicId, Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CrudService } from "#core/bases/crud-service.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { connectHoldRegistry } from "#core/functions/connect-hold-registry.function";
import { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";
import { registerModelPartners } from "#core/functions/register-model-partners.function";
import { sql } from "#core/functions/sql.function";
import { Database } from "#core/ports/database.port";
import { Disposal } from "#contracts/enums/disposal.enum";
import { HoldRegistry } from "#contracts/ports/hold-registry.port";
import { VisibilityFilter } from "#contracts/ports/visibility-filter.port";
import { MetricsReader } from "#core/values/metrics-reader.value";

// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the generated [OptionalProps] augmentation below
class Order extends Model.with(HasPublicId("ord")) {
  status = "pending";

  createdAt = new Date();
}

// The generated `[OptionalProps]` augmentation: fields with initializers may be left out of `create`.
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
interface Order {
  [OptionalProps]?: "id" | "status" | "createdAt";
}

class OrderService extends CrudService<Order> {}

class OrphanService extends CrudService<Order> {}

registerModelPartners([[OrderService, Order]]);

const metadata = {
  className: "Order",
  primaryKeys: ["id"],
  properties: {
    id: { fieldNames: ["id"] },
    createdAt: { fieldNames: ["created_at"] },
    scopePath: { fieldNames: ["scope_path"] },
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
    find: vi.fn(async () => []),
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

  it("sums a field and hands metrics to a reader", async () => {
    const em = connect();
    expect(await new OrderService().sum("createdAt")).toBe(42);
    expect(em.builder.select).toHaveBeenCalledTimes(1);
    expect(new OrderService().metrics(period, { on: "createdAt" })).toBeInstanceOf(MetricsReader);
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

describe("CrudService.purge with legal holds", () => {
  afterEach(() => {
    connectHoldRegistry(undefined);
  });

  /** A registry holding `ord_2`, recording what it was asked. */
  function registry() {
    const asked: unknown[][] = [];
    class Holds extends Driver(HoldRegistry) {
      async heldAmong<M extends object>(
        model: AnyClass<M>,
        ids: readonly string[],
        disposal: Disposal,
      ): Promise<ReadonlySet<string>> {
        asked.push([model, [...ids], disposal]);
        return new Set(ids.filter((id) => id === "ord_2"));
      }
    }
    return { holds: new Holds(), asked };
  }

  it("removes only the matching rows no hold covers", async () => {
    const em = connect();
    em.find.mockResolvedValueOnce([{ id: "ord_1" }, { id: "ord_2" }] as never);
    const { holds, asked } = registry();
    connectHoldRegistry(holds);
    expect(await new OrderService().purge({ status: "paid" })).toBe(2);
    expect(asked).toEqual([[Order, ["ord_1", "ord_2"], Disposal.Purge]]);
    expect(em.nativeDelete).toHaveBeenCalledWith(Order, {
      $and: [{ status: "paid" }, { id: { $in: ["ord_1"] } }],
    });
  });

  it("removes nothing when every match is held", async () => {
    const em = connect();
    em.find.mockResolvedValueOnce([{ id: "ord_2" }] as never);
    connectHoldRegistry(registry().holds);
    expect(await new OrderService().purge({ status: "paid" })).toBe(0);
    expect(em.nativeDelete).not.toHaveBeenCalled();
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

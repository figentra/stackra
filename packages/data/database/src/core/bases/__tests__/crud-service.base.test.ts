/**
 * Stackra file contract:
 * Purpose: unit tests of `CrudService`: the model comes from the registered partner (and an unregistered service
 *          says so), every read and write goes to the running context's entity manager with `$raw` turned into a raw
 *          key, `findOneOrFail` refuses with `not_found`, `insert` flushes in a savepoint or its own transaction,
 *          `update` assigns, `table` builds the cursor read, `sum` aggregates, and `metrics` returns a reader.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0307 (rules 2 and 16); ADR 0022; ADR 0269.
 */
import { TransactionPropagation } from "@mikro-orm/core";
import type { OptionalProps } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";
import { SortDirection } from "@stackra/contracts";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { HasPublicId, Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CrudService } from "#core/bases/crud-service.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { registerModelPartners } from "#core/functions/register-model-partners.function";
import { sql } from "#core/functions/sql.function";
import { Database } from "#core/ports/database.port";
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
  properties: { id: { fieldNames: ["id"] }, createdAt: { fieldNames: ["created_at"] } },
};

/** A recording entity manager. */
function fakeEm() {
  const builder = {
    select: vi.fn(() => builder),
    where: vi.fn(() => builder),
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

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
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
    const period = {
      from: new Date("2026-10-01T00:00:00Z"),
      to: new Date("2026-10-08T00:00:00Z"),
      days: 7,
      previous: { from: new Date("2026-09-24T00:00:00Z"), to: new Date("2026-10-01T00:00:00Z") },
    };
    expect(new OrderService().metrics(period, { on: "createdAt" })).toBeInstanceOf(MetricsReader);
  });

  it("names the service whose model gen has not registered", () => {
    connect();
    expect(() => new OrphanService().find({})).toThrow(/No model is registered for OrphanService/);
  });
});

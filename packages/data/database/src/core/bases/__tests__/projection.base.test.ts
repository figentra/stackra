/**
 * Stackra file contract:
 * Purpose: unit tests of `Projection`: the called form records exactly its key and keeps `instanceof`, a bad key is
 *          refused; `put` locks the current version, closes it and inserts the new one, and skips a write as old as
 *          the current version; `remove` closes the current version and is a no-op without one; `get` and `list` read
 *          the current versions or those in effect `asOf` a moment, `list` pages by record id and refuses a bad limit.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0163 (decision 1); ADR 0294 (decision 16); ADR 0305 (rule 5); ADR 0022; ADR 0269.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { kindOf } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Projection, ProjectionBase } from "#core/bases/projection.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { Database } from "#core/ports/database.port";

interface OrderBookRow {
  status: string;
  totalMinor: number;
}

class OrderBook extends Projection<OrderBookRow>({ key: "order_book" }) {}

const scope = { id: "scp_01", path: "t1" } as unknown as ScopeRef;

const t1 = new Date("2026-10-01T00:00:00Z");
const t2 = new Date("2026-10-02T00:00:00Z");

/** A database whose `execute` answers each statement with `answer(sql)`. */
function connect(answer: (sql: string) => unknown[] = () => []) {
  const execute = vi.fn(async (sql: string, _params: unknown[]) => answer(sql));
  const em = { execute } as unknown as EntityManager;
  ACTIVE_DATABASE.current = new (class extends Database {
    em(): EntityManager {
      return em;
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
  })();
  return execute;
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

describe("Projection", () => {
  it("records exactly its key and keeps instanceof", () => {
    expect(kindOf(OrderBook)).toEqual({ kind: "projection", options: { key: "order_book" } });
    expect(new OrderBook()).toBeInstanceOf(ProjectionBase);
    expect(new OrderBook().projectionKey).toBe("order_book");
  });

  it("refuses a key that is not snake_case words joined by dots", () => {
    expect(() => Projection<OrderBookRow>({ key: "OrderBook" })).toThrow(TypeError);
    expect(() => Projection<OrderBookRow>({ key: "" })).toThrow(TypeError);
  });

  it("puts a first version without closing anything", async () => {
    const execute = connect();
    await expect(
      new OrderBook().put(scope, "ord_1", { status: "paid", totalMinor: 500 }, t1),
    ).resolves.toBe(true);
    const statements = execute.mock.calls.map(([sql]) => sql);
    expect(statements[0]).toContain("for update");
    expect(statements.some((sql) => sql.startsWith("update"))).toBe(false);
    const insert = execute.mock.calls.find(([sql]) => sql.startsWith("insert"));
    expect(insert?.[1]).toEqual([
      "order_book",
      "scp_01",
      "t1",
      "ord_1",
      '{"status":"paid","totalMinor":500}',
      t1,
    ]);
  });

  it("closes the current version before a newer one", async () => {
    const execute = connect((sql) => (sql.includes("for update") ? [{ valid_from: t1 }] : []));
    await expect(
      new OrderBook().put(scope, "ord_1", { status: "shipped", totalMinor: 500 }, t2),
    ).resolves.toBe(true);
    const update = execute.mock.calls.find(([sql]) => sql.startsWith("update"));
    expect(update?.[1]).toEqual([t2, "order_book", "scp_01", "ord_1"]);
  });

  it("skips a write as old as the current version", async () => {
    const execute = connect((sql) => (sql.includes("for update") ? [{ valid_from: t2 }] : []));
    await expect(
      new OrderBook().put(scope, "ord_1", { status: "paid", totalMinor: 500 }, t1),
    ).resolves.toBe(false);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("removes by closing the current version, and does nothing without one", async () => {
    let execute = connect((sql) => (sql.includes("for update") ? [{ valid_from: t1 }] : []));
    await expect(new OrderBook().remove(scope, "ord_1", t2)).resolves.toBe(true);
    expect(execute.mock.calls.some(([sql]) => sql.startsWith("insert"))).toBe(false);
    execute = connect();
    await expect(new OrderBook().remove(scope, "ord_1", t2)).resolves.toBe(false);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("refuses an empty record id", async () => {
    connect();
    await expect(
      new OrderBook().put(scope, "", { status: "paid", totalMinor: 1 }, t1),
    ).rejects.toThrow(TypeError);
  });

  it("reads the current version, or the one in effect as of a moment", async () => {
    const execute = connect(() => [
      { record_id: "ord_1", data: { status: "paid", totalMinor: 500 }, valid_from: t1 },
    ]);
    const book = new OrderBook();
    await expect(book.get("ord_1")).resolves.toEqual({
      id: "ord_1",
      data: { status: "paid", totalMinor: 500 },
      validFrom: t1,
    });
    expect(execute.mock.calls[0]?.[0]).toContain("valid_to is null");
    await book.get("ord_1", { asOf: t2 });
    expect(execute.mock.calls[1]?.[0]).toContain("valid_from <= ?");
    expect(execute.mock.calls[1]?.[1]).toEqual(["order_book", "ord_1", t2, t2]);
  });

  it("lists a page after a record id, and refuses a bad limit", async () => {
    const execute = connect(() => []);
    const book = new OrderBook();
    await book.list({ after: "ord_1", limit: 2 });
    expect(execute.mock.calls[0]?.[0]).toContain("record_id > ?");
    expect(execute.mock.calls[0]?.[1]).toEqual(["order_book", "ord_1", 2]);
    await expect(book.list({ limit: 0 })).rejects.toThrow(RangeError);
    await expect(book.list({ limit: 1001 })).rejects.toThrow(RangeError);
  });
});

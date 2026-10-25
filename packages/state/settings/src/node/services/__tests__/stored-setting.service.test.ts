/**
 * Stackra file contract:
 * Purpose: unit tests of `StoredSettingService`: the chain read is a parameterised raw `ltree` ancestor condition on
 *          the target's path or the session's `app.scope_path`, in path order, followed by the user's row; a store
 *          adds a row for a new holder, merges values and sets locks on an existing one, a drop removes paths and their
 *          locks, and both refuse a target with no holder.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 3 and 9); ADR 0160.
 */
import type { ScopeRef } from "@stackra/contracts";
import { Database, registerModelPartners } from "@stackra/database";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { StoredSetting } from "#node/models/stored-setting.model";
import { StoredSettingService } from "#node/services/stored-setting.service";

registerModelPartners([[StoredSettingService, StoredSetting]]);

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" as const;

/** A stored row with `data`. */
const rowOf = (data: Partial<StoredSetting>): StoredSetting =>
  Object.assign(new StoredSetting(), { values: {}, locked: [], ...data });

/** Connects a recording entity manager whose `find` answers `nodes` and `findOne` answers `one`. */
function connect(nodes: StoredSetting[] = [], one: StoredSetting | null = null) {
  const em = {
    find: vi.fn(async (_model: unknown, _where: object, _options?: unknown) => nodes),
    findOne: vi.fn(async (_model: unknown, _where: object) => one),
    findOneOrFail: vi.fn(async () => {
      if (one === null) throw new TypeError("no row");
      return one;
    }),
    create: vi.fn((_model: unknown, data: object) => Object.assign(new StoredSetting(), data)),
    assign: vi.fn((row: object, data: object) => Object.assign(row, data)),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

/** The raw condition of a filter: its one symbol key, described as `raw('<sql>')`. */
const conditionOf = (where: object) => Object.getOwnPropertySymbols(where)[0]?.description;

afterEach(() => {
  vi.restoreAllMocks();
});

describe(StoredSettingService, () => {
  it("reads the node chain on the target's path in path order, then the user's row", async () => {
    const node = rowOf({ scopePath: "platform" });
    const user = rowOf({ userId: USER });
    const em = connect([node], user);
    await expect(
      new StoredSettingService().chainOf("orders", { scope: ACME, user: USER }),
    ).resolves.toEqual([node, user]);
    const [model, where, options] = em.find.mock.calls[0] ?? [];
    expect(model).toBe(StoredSetting);
    expect(where).toMatchObject({ groupKey: "orders" });
    expect(conditionOf(where ?? {})).toContain("scope_path @> ?::ltree");
    expect(conditionOf(where ?? {})).not.toContain("platform.acme");
    expect(options).toEqual({ orderBy: { scopePath: "asc" } });
    expect(em.findOne.mock.calls[0]?.[1]).toEqual({ groupKey: "orders", userId: USER });
  });

  it("reads the session's scope when the target names no node", async () => {
    const em = connect();
    await expect(new StoredSettingService().chainOf("orders", {})).resolves.toEqual([]);
    expect(conditionOf(em.find.mock.calls[0]?.[1] ?? {})).toContain(
      "current_setting('app.scope_path', true)",
    );
    expect(em.findOne).not.toHaveBeenCalled();
  });

  it("adds a row for a new holder with its locks", async () => {
    const em = connect();
    const row = await new StoredSettingService().store("orders", { scope: ACME }, { a: 1, b: 2 }, [
      "a",
    ]);
    expect(row).toMatchObject({
      groupKey: "orders",
      scopeId: ACME.id,
      scopePath: ACME.path,
      userId: null,
      values: { a: 1, b: 2 },
      locked: ["a"],
    });
    expect(em.findOne.mock.calls[0]?.[1]).toEqual({ groupKey: "orders", scopeId: ACME.id });
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it("merges values into an existing row and keeps or sets its locks", async () => {
    const existing = rowOf({ userId: USER, values: { a: 1, b: 2 }, locked: ["b"] });
    connect([], existing);
    const service = new StoredSettingService();
    await service.store("orders", { user: USER }, { a: 3 });
    expect(existing).toMatchObject({ values: { a: 3, b: 2 }, locked: ["b"] });
    await service.store("orders", { user: USER }, { b: 4 }, []);
    expect(existing).toMatchObject({ values: { a: 3, b: 4 }, locked: [] });
  });

  it("drops paths and their locks from the holder's row, and skips a holder with no row", async () => {
    const existing = rowOf({ userId: USER, values: { a: 1, b: 2 }, locked: ["a", "b"] });
    connect([], existing);
    await new StoredSettingService().drop("orders", { user: USER }, ["a"]);
    expect(existing).toMatchObject({ values: { b: 2 }, locked: ["b"] });
    const em = connect([], null);
    await new StoredSettingService().drop("orders", { scope: ACME }, ["a"]);
    expect(em.flush).not.toHaveBeenCalled();
  });

  it("refuses a target with no holder", async () => {
    connect();
    await expect(new StoredSettingService().store("orders", {}, { a: 1 })).rejects.toThrow(
      TypeError,
    );
  });
});

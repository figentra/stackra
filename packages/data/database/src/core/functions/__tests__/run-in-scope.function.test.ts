/**
 * Stackra file contract:
 * Purpose: unit tests of `runInScope`: at the top level the work runs in a transaction after one `set_config` of the
 *          scope settings and nothing after it; inside a running transaction the enclosing settings are read first and
 *          set back after the work, once its writes are flushed; a throw passes through with nothing set after it.
 * Boundary: test only; a fake `Database` records the statements, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0327 (decisions 3 and 5); ADR 0495; ADR 0022.
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { runInScope } from "#core/functions/run-in-scope.function";
import type { Database } from "#core/ports/database.port";

const shop: ScopeRef = { id: "scp_01ja0000000000000000000002", path: "platform.acme.shop_eu" };

const SET = "select set_config(?, ?, true), set_config(?, ?, true), set_config(?, ?, true)";

/** A recording database whose transaction runs the work; `nested` says whether one is already running. */
function setUp(nested = false) {
  const steps: unknown[][] = [];
  const execute = vi.fn(async (sql: string, params: unknown[]) => {
    steps.push([sql.startsWith("select name") ? "read" : sql, params]);
    return sql.startsWith("select name")
      ? [
          { name: "app.scope_id", value: "scp_outer" },
          { name: "app.scope_path", value: "platform.acme" },
          { name: "app.scope_paths", value: "platform.acme" },
        ]
      : [];
  });
  const flush = vi.fn(async () => {
    steps.push(["flush"]);
  });
  const database = {
    em: () => ({ execute, flush, isInTransaction: () => nested }),
    transaction: async (work: () => Promise<unknown>) => work(),
  } as unknown as Database;
  return { steps, database };
}

describe("runInScope", () => {
  it("sets the scope once at the top level and nothing after the work", async () => {
    const { steps, database } = setUp();
    expect(await runInScope(database, shop, async () => 42)).toBe(42);
    expect(steps).toEqual([
      [SET, ["app.scope_id", shop.id, "app.scope_path", shop.path, "app.scope_paths", shop.path]],
    ]);
  });

  it("puts the enclosing scope back after the work inside a running transaction, its writes flushed first", async () => {
    const { steps, database } = setUp(true);
    await runInScope(database, shop, async () => null);
    expect(steps).toEqual([
      ["read", ["app.scope_id", "app.scope_path", "app.scope_paths"]],
      [SET, ["app.scope_id", shop.id, "app.scope_path", shop.path, "app.scope_paths", shop.path]],
      ["flush"],
      [
        SET,
        [
          "app.scope_id",
          "scp_outer",
          "app.scope_path",
          "platform.acme",
          "app.scope_paths",
          "platform.acme",
        ],
      ],
    ]);
  });

  it("passes a throw through and sets nothing after it, leaving the restore to the savepoint's rollback", async () => {
    const { steps, database } = setUp(true);
    const failure = new Error("work failed");
    await expect(
      runInScope(database, shop, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(steps.map(([step]) => step)).toEqual(["read", SET]);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresSnapshotStoreDriver`: it is the `SnapshotStore` port; a save is one upsert bound to
 *          the room's scope with the state as bytes; `latest` reads by document and scope and answers bytes and the
 *          time, or `undefined`.
 * Boundary: test only; a stand-in entity manager records each statement, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2); ADR 0160.
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { SnapshotStore } from "#contracts/index";
import { PostgresSnapshotStoreDriver } from "#node/drivers/postgres-snapshot-store.driver";

function database(rows: readonly object[]) {
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const db = {
    em: () => ({
      execute: async (sql: string, params: readonly unknown[] = []) => {
        statements.push({ sql, params });
        return rows;
      },
    }),
  } as unknown as Database;
  return { db, statements };
}

const ROOM = { document: "pag_1" as const, scope: { id: "scp_1" as const, path: "platform.acme" } };

describe(PostgresSnapshotStoreDriver, () => {
  it("saves with one upsert bound to the room's scope", async () => {
    const { db, statements } = database([]);
    const store = new PostgresSnapshotStoreDriver(db);
    expect(store).toBeInstanceOf(SnapshotStore);
    const savedAt = new Date("2026-10-25T09:00:00.000Z");
    await store.save(ROOM, { state: new Uint8Array([1, 2]), savedAt });
    const [statement] = statements;
    expect(statement?.sql).toContain(
      "where current.scope_id is not distinct from excluded.scope_id",
    );
    expect(statement?.params.slice(0, 2)).toEqual(["pag_1", "scp_1"]);
    expect(Array.from(statement?.params[2] as Uint8Array)).toEqual([1, 2]);
    expect(statement?.params[3]).toBe(savedAt);
  });

  it("reads the latest state of the room's scope", async () => {
    const { db, statements } = database([
      { state: Buffer.from([3, 4]), saved_at: "2026-10-25T09:00:00.000Z" },
    ]);
    const snapshot = await new PostgresSnapshotStoreDriver(db).latest({ document: "pag_1" });
    expect(snapshot).toEqual({
      state: new Uint8Array([3, 4]),
      savedAt: new Date("2026-10-25T09:00:00.000Z"),
    });
    expect(statements[0]?.params).toEqual(["pag_1", null]);
    expect(await new PostgresSnapshotStoreDriver(database([]).db).latest(ROOM)).toBeUndefined();
  });
});

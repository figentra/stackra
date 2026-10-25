/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresInboxDriver`: a claim is one bound insert that does nothing on a known id, read as
 *          `true` when a row came back and `false` otherwise; a prune is one bound delete before the cut-off.
 * Boundary: test only; a stand-in entity manager records each statement and answers fixed rows. The SQL itself runs in
 *           the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4); ADR 0160.
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { InboxDriver } from "#contracts/index";
import { PostgresInboxDriver } from "#node/drivers/postgres-inbox.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** A database whose entity manager records each statement and answers `rows`. */
function databaseWith(rows: readonly object[] = []) {
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return rows;
    },
  };
  return { database: { em: () => em } as unknown as Database, statements };
}

describe(PostgresInboxDriver, () => {
  it("is an InboxDriver", () => {
    expect(new PostgresInboxDriver({} as Database)).toBeInstanceOf(InboxDriver);
  });

  it("claims with one bound insert that does nothing on a known id", async () => {
    const { database, statements } = databaseWith([{ event_id: "evt_1" }]);
    await expect(new PostgresInboxDriver(database).claim("evt_1", NOON)).resolves.toBe(true);
    expect(statements[0]?.sql).toContain('insert into "outbox"."inbox"');
    expect(statements[0]?.sql).toContain("on conflict (event_id) do nothing returning event_id");
    expect(statements[0]?.sql).not.toContain("evt_1");
    expect(statements[0]?.params).toEqual(["evt_1", NOON]);
  });

  it("reads a known id as false", async () => {
    const { database } = databaseWith([]);
    await expect(new PostgresInboxDriver(database).claim("evt_1", NOON)).resolves.toBe(false);
  });

  it("prunes with one bound delete", async () => {
    const { database, statements } = databaseWith();
    await new PostgresInboxDriver(database).prune(NOON);
    expect(statements).toEqual([
      { sql: 'delete from "outbox"."inbox" where received_at < ?', params: [NOON] },
    ]);
  });
});

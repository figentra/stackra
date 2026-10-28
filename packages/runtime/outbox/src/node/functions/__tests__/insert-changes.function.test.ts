/**
 * Stackra file contract:
 * Purpose: unit tests of `insertChanges`: one statement per batch with the entries as one bound JSON array (no value in
 *          the text), the scope columns read from the transaction's scope settings, and nothing sent for no entries.
 * Boundary: test only; a stand-in entity manager records each statement. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0160.
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { RowChangeKind } from "#contracts/index";
import type { RowChange } from "#contracts/index";
import { insertChanges } from "#node/functions/insert-changes.function";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** An entity manager that records each statement. */
function recordingEm() {
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return [];
    },
  } as unknown as ReturnType<Database["em"]>;
  return { em, statements };
}

const CHANGE: RowChange = {
  model: "Product",
  id: "prd_1",
  kind: RowChangeKind.Updated,
  fields: ["name"],
  before: { name: "Old" },
  after: { name: "New" },
};

describe(insertChanges, () => {
  it("appends a batch in one statement, the entries bound as one JSON array", async () => {
    const { em, statements } = recordingEm();
    await insertChanges(em, [
      { change: CHANGE, meta: { correlationId: "call-1" }, occurredAt: NOON },
    ]);
    expect(statements).toHaveLength(1);
    const [insert] = statements;
    expect(insert?.sql).toContain('insert into "outbox"."changes"');
    expect(insert?.sql).toContain("current_setting('app.scope_path', true)");
    expect(insert?.sql.split("?")).toHaveLength(2);
    expect(insert?.sql).not.toContain("prd_1");
    expect(JSON.parse(String(insert?.params[0]))).toEqual([
      {
        type: "Product",
        data: CHANGE,
        meta: { correlationId: "call-1" },
        occurred_at: NOON.toISOString(),
      },
    ]);
  });

  it("sends nothing for no entries", async () => {
    const { em, statements } = recordingEm();
    await insertChanges(em, []);
    expect(statements).toEqual([]);
  });
});

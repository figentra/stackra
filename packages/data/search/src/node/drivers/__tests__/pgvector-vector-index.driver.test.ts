/**
 * Stackra file contract:
 * Purpose: unit tests of `PgvectorVectorIndexDriver`: an upsert writes one statement with every value bound (the
 *          vector as a pgvector literal, the scope's id and path, the metadata as jsonb) and keeps the last item of a
 *          repeated id; a query orders by cosine distance within the scope's subtree, binds the filter only when one is
 *          given, and maps rows to hits; a remove deletes by id; nothing runs for an empty list; a bad vector or topK
 *          is refused before any SQL.
 * Boundary: test only; a stand-in entity manager records each statement and answers a query from fixed rows, so no
 *           database runs. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0160; ADR 0327 (decision 9); owner decision 23.
 */
import type { ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { VectorIndex } from "#contracts/index";
import { PgvectorVectorIndexDriver } from "#node/drivers/pgvector-vector-index.driver";

const ACME: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w3", path: "acme" };

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A database whose entity manager records statements and answers a select with `rows`. */
function databaseWith(rows: readonly object[] = []) {
  const statements: Statement[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return sql.startsWith("select") ? rows : [];
    },
  };
  return { database: { em: () => em } as unknown as Database, statements };
}

describe(PgvectorVectorIndexDriver, () => {
  it("is a VectorIndex", () => {
    expect(new PgvectorVectorIndexDriver({} as Database)).toBeInstanceOf(VectorIndex);
  });

  it("upserts every item in one statement, the last of a repeated id kept", async () => {
    const { database, statements } = databaseWith();
    const index = new PgvectorVectorIndexDriver(database);
    await index.upsert([
      { id: "doc_1#0", scope: ACME, vector: [0.1, 0.2], text: "old", metadata: {} },
      {
        id: "doc_1#1",
        scope: ACME,
        vector: [0.3, 0.4],
        text: "second",
        metadata: { locale: "en" },
      },
      { id: "doc_1#0", scope: ACME, vector: [0.5, 0.6], text: "first", metadata: {} },
    ]);
    expect(statements).toHaveLength(1);
    const [upsert] = statements;
    expect(upsert?.sql).toContain(
      'insert into "search"."vector_items" ("id", "scope_id", "scope_path", "embedding", "text", "metadata")',
    );
    expect(upsert?.sql).toContain(
      "values (?, ?, ?::ltree, ?::vector, ?, ?::jsonb), (?, ?, ?::ltree, ?::vector, ?, ?::jsonb)",
    );
    expect(upsert?.sql).toContain('on conflict ("id") do update set');
    expect(upsert?.params).toEqual([
      "doc_1#0",
      ACME.id,
      "acme",
      "[0.5,0.6]",
      "first",
      "{}",
      "doc_1#1",
      ACME.id,
      "acme",
      "[0.3,0.4]",
      "second",
      '{"locale":"en"}',
    ]);
  });

  it("queries by cosine distance within the scope's subtree and maps the rows", async () => {
    const { database, statements } = databaseWith([
      { id: "doc_1#0", score: "0.92", text: "Returns within 30 days", metadata: { locale: "en" } },
    ]);
    const index = new PgvectorVectorIndexDriver(database);
    const hits = await index.query([1, 0], { topK: 5, scope: ACME });
    expect(hits).toEqual([
      { id: "doc_1#0", score: 0.92, text: "Returns within 30 days", metadata: { locale: "en" } },
    ]);
    const [query] = statements;
    expect(query?.sql).toBe(
      `select "id", 1 - ("embedding" <=> ?::vector) as "score", "text", "metadata"
from "search"."vector_items"
where "scope_path" <@ ?::ltree
order by "embedding" <=> ?::vector, "id"
limit ?`,
    );
    expect(query?.params).toEqual(["[1,0]", "acme", "[1,0]", 5]);
  });

  it("binds a metadata filter as jsonb containment", async () => {
    const { database, statements } = databaseWith();
    const index = new PgvectorVectorIndexDriver(database);
    await index.query([1, 0], { topK: 3, scope: ACME, filter: { locale: "ar" } });
    expect(statements[0]?.sql).toContain(
      `where "scope_path" <@ ?::ltree and "metadata" @> ?::jsonb`,
    );
    expect(statements[0]?.params).toEqual(["[1,0]", "acme", '{"locale":"ar"}', "[1,0]", 3]);
  });

  it("removes by id, and runs nothing for an empty list", async () => {
    const { database, statements } = databaseWith();
    const index = new PgvectorVectorIndexDriver(database);
    await index.remove(["doc_1#0", "doc_1#1"]);
    await index.remove([]);
    await index.upsert([]);
    expect(statements).toEqual([
      {
        sql: 'delete from "search"."vector_items" where "id" in (?, ?)',
        params: ["doc_1#0", "doc_1#1"],
      },
    ]);
  });

  it("refuses a bad vector or topK before any SQL", async () => {
    const { database, statements } = databaseWith();
    const index = new PgvectorVectorIndexDriver(database);
    await expect(
      index.upsert([{ id: "x", scope: ACME, vector: [Number.NaN], text: "", metadata: {} }]),
    ).rejects.toThrow(TypeError);
    await expect(index.query([], { topK: 1, scope: ACME })).rejects.toThrow(TypeError);
    await expect(index.query([1], { topK: 0, scope: ACME })).rejects.toThrow(TypeError);
    expect(statements).toEqual([]);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateVectorHnswIndexMigration`: one transactional step that creates the partial HNSW index
 *          on `"embedding"::vector(1024)` by cosine distance for the rows of that dimension (the driver's exact
 *          expression and predicate), and drops it on the way down.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0160; STA-1251.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateVectorHnswIndexMigration } from "#node/database/migrations/0004-create-vector-hnsw-index.migration";

describe("CreateVectorHnswIndexMigration", () => {
  const { after, steps } = compileMigration(CreateVectorHnswIndexMigration, { schema: "search" });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("indexes the 1024-number embeddings by cosine distance with HNSW", () => {
    expect(sql).toContain('on "search"."vector_items" using hnsw');
    expect(sql).toContain('(("embedding"::vector(1024)) vector_cosine_ops)');
    expect(sql).toContain('where vector_dims("embedding") = 1024');
  });

  it("drops the index on the way down", () => {
    expect(step?.inverse).toEqual([
      'drop index if exists "search"."vector_items_embedding_hnsw_1024"',
    ]);
  });
});

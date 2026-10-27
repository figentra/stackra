/**
 * Stackra file contract:
 * Purpose: unit tests of `DropEmbeddingsMigration`: it compiles to one statement that drops `ai.embeddings` and
 *          declares no inverse, so the one vector store is `search.vector_items` (ADR 0465).
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); ADR 0465.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { DropEmbeddingsMigration } from "#node/database/migrations/0002-drop-embeddings.migration";

describe("DropEmbeddingsMigration", () => {
  const { steps } = compileMigration(DropEmbeddingsMigration, { schema: "ai" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("drops the ai embeddings table", () => {
    expect(sql).toContain('drop table if exists "ai"."embeddings"');
  });

  it("drops nothing else", () => {
    expect(sql.match(/drop table/g)).toHaveLength(1);
  });
});

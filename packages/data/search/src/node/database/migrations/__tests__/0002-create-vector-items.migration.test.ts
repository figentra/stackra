/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateVectorItemsMigration`: one transactional step that creates the approved `vector` and
 *          `ltree` extensions, `search.vector_items` with its id key, scope columns and jsonb metadata under the forced
 *          scope policy, then its `vector` embedding column, each undone last first.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0160; ADR 0327 (decision 9).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateVectorItemsMigration } from "#node/database/migrations/0002-create-vector-items.migration";

describe("CreateVectorItemsMigration", () => {
  const { after, steps } = compileMigration(CreateVectorItemsMigration, { schema: "search" });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the extensions and the table under the forced scope policy", () => {
    expect(step?.sql[0]).toBe('create extension if not exists "vector"');
    expect(step?.sql[1]).toBe('create extension if not exists "ltree"');
    expect(sql).toContain('create table "search"."vector_items"');
    expect(sql).toContain('"id" varchar(200) not null');
    expect(sql).toContain('primary key ("id")');
    expect(sql).toContain('"scope_path" ltree not null');
    expect(sql).toContain(`"metadata" jsonb default '{}'::jsonb not null`);
    expect(sql).toContain('alter table "search"."vector_items" force row level security');
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
  });

  it("adds the embedding column after the table and undoes it first", () => {
    expect(sql).toContain(
      'alter table "search"."vector_items" add column "embedding" vector not null',
    );
    expect(step?.inverse).not.toBe(false);
    const inverse = step?.inverse === false ? [] : (step?.inverse ?? []);
    expect(inverse.slice(0, 2)).toEqual([
      'comment on column "search"."vector_items"."embedding" is null',
      'alter table "search"."vector_items" drop column if exists "embedding"',
    ]);
    expect(inverse.at(-1)).toBe('drop extension if exists "vector"');
  });
});

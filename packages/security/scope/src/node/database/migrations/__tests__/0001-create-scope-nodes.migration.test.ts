/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateScopeNodesMigration`: it compiles to one transactional step that creates the `ltree`
 *          extension and `scope.scope_nodes` with the `scp` primary key, a text level with no check constraint, the
 *          unique path with its GiST index, and the forced ancestor policy on `app.scope_paths`; no `scope_id` column.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 2, 3 and 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateScopeNodesMigration } from "#node/database/migrations/0001-create-scope-nodes.migration";

describe("CreateScopeNodesMigration", () => {
  const { after, steps } = compileMigration(CreateScopeNodesMigration, {
    schema: "scope",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the extension and the table with its columns", () => {
    expect(sql).toContain("ltree");
    expect(sql).toContain('create table "scope"."scope_nodes"');
    expect(sql).toContain('"id" varchar(33) not null');
    expect(sql).toContain('"level" varchar(63) not null');
    expect(sql).toContain('"scope_path" ltree not null');
    expect(sql).toContain('"name" varchar(200) not null');
    expect(sql).not.toContain('"scope_id"');
    expect(sql).not.toContain("ck_scope_nodes_level");
  });

  it("indexes the path uniquely and with GiST, under the forced ancestor policy", () => {
    expect(sql).toContain('using gist ("scope_path")');
    expect(sql).toContain(
      'create unique index "idx_scope_nodes_scope_path_key" on "scope"."scope_nodes" ("scope_path")',
    );
    expect(step?.inverse).toContain(
      'drop index if exists "scope"."idx_scope_nodes_scope_path_key"',
    );
    expect(sql).toContain('alter table "scope"."scope_nodes" force row level security');
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
  });
});

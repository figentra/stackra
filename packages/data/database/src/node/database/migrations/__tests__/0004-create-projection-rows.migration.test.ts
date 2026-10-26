/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateProjectionRowsMigration`: one transactional step that creates
 *          `database.projection_rows` with its version key, its one-current-version unique index, the jsonb data and
 *          the forced ancestor policy on `app.scope_paths`.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0163 (decision 1); ADR 0159 (as amended); ADR 0327 (decisions 3 and 9); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { CreateProjectionRowsMigration } from "#node/database/migrations/0004-create-projection-rows.migration";

describe("CreateProjectionRowsMigration", () => {
  const { steps } = compileMigration(CreateProjectionRowsMigration, { schema: "database" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("creates the versions table in one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
    expect(sql).toContain('create table "database"."projection_rows"');
    expect(sql).toContain('"data" jsonb not null');
    expect(sql).toContain('primary key ("projection_key", "scope_id", "record_id", "valid_from")');
  });

  it("keeps at most one current version per record", () => {
    expect(sql).toContain("idx_projection_rows_projection_key_scope_id_record_id");
    expect(sql).toContain("where valid_to is null");
  });

  it("forces the ancestor policy", () => {
    expect(sql).toContain('alter table "database"."projection_rows" force row level security');
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreMigrationSql`: an online step's Encore copy loses its marker and every `concurrently`,
 *          and a transactional step is returned byte for byte.
 * Boundary: test only; files are built with `emitMigrations`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (the amendment of 2026-11-10).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitMigrations } from "#core/functions/emit-migrations.function";
import { encoreMigrationSql } from "#core/functions/encore-migration-sql.function";
import type { MigrationUnit } from "#core/types/migration-unit.type";

const UNIT: MigrationUnit = {
  id: "database.0006_add_isolation_scope",
  owner: "package",
  file: "@stackra/database/src/node/database/migrations/0006-add-isolation-scope.migration.ts",
  after: [],
  steps: [
    {
      sql: [
        'alter table "database"."projection_rows" add column "isolation_scope_id" varchar(33) null',
      ],
      transactional: true,
      inverse: ['alter table "database"."projection_rows" drop column "isolation_scope_id"'],
    },
    {
      sql: [
        'create index concurrently "idx_projection_rows_isolation_scope_id" on "database"."projection_rows" ("isolation_scope_id")',
      ],
      transactional: false,
      inverse: [
        'drop index concurrently if exists "database"."idx_projection_rows_isolation_scope_id"',
      ],
    },
    {
      sql: ['CREATE UNIQUE INDEX CONCURRENTLY "u" ON "a" ("b")', 'REINDEX INDEX CONCURRENTLY "u"'],
      transactional: false,
      inverse: false,
    },
  ],
};

const files = emitMigrations([UNIT]);
const content = (suffix: string): string =>
  files.find((file) => file.path.endsWith(suffix))?.content ?? "";

describe("encoreMigrationSql", () => {
  it("writes an online step's index build in its plain form, without the marker Encore cannot honour", () => {
    const up = encoreMigrationSql(content("_2.up.sql"));
    expect(up).toContain(
      'create index "idx_projection_rows_isolation_scope_id" on "database"."projection_rows" ("isolation_scope_id");',
    );
    expect(up).not.toMatch(/concurrently/i);
    expect(up).not.toContain("-- stackra:transactional=false");
    expect(up.startsWith("-- Encore runs this file in one transaction")).toBe(true);
  });

  it("does the same for the inverse and for every concurrent statement, in any case", () => {
    expect(encoreMigrationSql(content("_2.down.sql"))).toContain(
      'drop index if exists "database"."idx_projection_rows_isolation_scope_id";',
    );
    const third = encoreMigrationSql(content("_3.up.sql"));
    expect(third).toContain('CREATE UNIQUE INDEX "u" ON "a" ("b");');
    expect(third).toContain('REINDEX INDEX "u";');
  });

  it("returns a transactional step as it is", () => {
    for (const suffix of ["_1.up.sql", "_1.down.sql"])
      expect(encoreMigrationSql(content(suffix))).toBe(content(suffix));
  });
});

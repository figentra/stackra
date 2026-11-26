/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateCacheTablesMigration`: one transactional step that makes the `cache` schema and the
 *          `postgres` cache driver's two unlogged tables and sweep indexes in the shape `postgresCacheTables("cache")`
 *          states, every statement `if not exists` (so it adopts tables a service already made), no tenant column and
 *          no row-level security, and an inverse that drops the tables before the schema.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0150 (decision 1); ADR 0159 (as amended); ADR 0210 (2026-10-24 amendment); ADR 0022; ADR
 *                     0269.
 */
import { postgresCacheTables } from "@stackra/cache/node";
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { CreateCacheTablesMigration } from "#node/database/migrations/0005-create-cache-tables.migration";

describe("CreateCacheTablesMigration", () => {
  const { after, steps } = compileMigration(CreateCacheTablesMigration, {
    schema: "database",
    createsSchema: true,
  });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the cache schema, then the driver's tables in the shape postgresCacheTables states", () => {
    expect(statements).toContain('create schema if not exists "cache"');
    const created = postgresCacheTables("cache").map((table) =>
      table.statement.replace(/^create (unlogged table|index) /, "create $1 if not exists "),
    );
    expect(
      statements.filter((statement) => /^create (unlogged table|index) /.test(statement)),
    ).toEqual(created);
  });

  it("is a platform table: no tenant column and no row-level security", () => {
    expect(sql).not.toContain("tenant_id");
    expect(sql).not.toContain("row level security");
  });

  it("undoes the tables before the schema", () => {
    const inverse = step?.inverse === false ? [] : (step?.inverse ?? []);
    expect(inverse).toContain('drop table if exists "cache"."entries"');
    expect(inverse).toContain('drop table if exists "cache"."set_members"');
    expect(inverse.indexOf('drop schema if exists "cache"')).toBeGreaterThan(
      inverse.indexOf('drop table if exists "cache"."entries"'),
    );
  });
});

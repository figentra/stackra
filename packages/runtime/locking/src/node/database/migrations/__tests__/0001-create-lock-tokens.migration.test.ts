/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateLockTokensMigration`: one transactional step that creates the `locking` schema and the
 *          `locking.lock_tokens` table keyed by the lock key, every column commented, no Postgres sequence and no
 *          row-level-security policy, needing no other member's migration.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0149 (decision 3); ADR 0394 (decision 3); R-16.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateLockTokensMigration } from "#node/database/migrations/0001-create-lock-tokens.migration";

describe("CreateLockTokensMigration", () => {
  const { after, steps } = compileMigration(CreateLockTokensMigration, {
    schema: "locking",
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

  it("creates the schema, then the lock key table keyed by its key", () => {
    expect(statements[0]).toBe('create schema if not exists "locking"');
    expect(sql).toContain('create table "locking"."lock_tokens"');
    expect(sql).toContain('"lock_key" text not null');
    expect(sql).toContain('"leased_at" timestamptz not null');
    expect(sql).toMatch(/primary key \("lock_key"\)/);
  });

  it("creates no sequence and no policy", () => {
    expect(sql).not.toMatch(/sequence/i);
    expect(sql).not.toContain("row level security");
  });

  it("comments every column", () => {
    for (const column of ["lock_key", "leased_at"])
      expect(
        statements.some((statement) =>
          statement.startsWith(`comment on column "locking"."lock_tokens"."${column}"`),
        ),
      ).toBe(true);
  });

  it("undoes the table, then the schema", () => {
    const inverse = step?.inverse === false ? [] : (step?.inverse ?? []);
    expect(inverse.at(-1)).toBe('drop schema if exists "locking"');
    expect(inverse.some((statement) => statement.includes('"locking"."lock_tokens"'))).toBe(true);
  });
});

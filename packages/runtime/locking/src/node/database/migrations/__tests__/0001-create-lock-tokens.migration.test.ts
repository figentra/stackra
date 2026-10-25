/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateLockTokensMigration`: one transactional step that creates the `locking` schema and the
 *          `locking.lock_tokens` bigint sequence, each with its inverse, needing no other member's migration.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0149 (decision 3).
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

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the schema and the token sequence", () => {
    expect(step?.sql).toEqual([
      'create schema if not exists "locking"',
      "create sequence locking.lock_tokens as bigint",
    ]);
  });

  it("undoes the sequence, then the schema", () => {
    expect(step?.inverse).toEqual([
      "drop sequence if exists locking.lock_tokens",
      'drop schema if exists "locking"',
    ]);
  });
});

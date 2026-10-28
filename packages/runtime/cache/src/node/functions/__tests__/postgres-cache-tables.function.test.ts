/**
 * Stackra file contract:
 * Purpose: unit tests of `postgresCacheTables`: two unlogged tables in the given schema with the "C"-collated keys and
 *          the columns the driver's statements name, an index on each table's `expires_at`, and an inverse per
 *          statement.
 * Boundary: test only; pure strings, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decision 1); ADR
 *                     0159 (raw statements carry their inverse).
 */
import { describe, expect, it } from "@stackra/testing";

import { postgresCacheTables } from "#node/functions/postgres-cache-tables.function";

describe("postgresCacheTables", () => {
  it("creates the two unlogged tables and their sweep indexes in the schema", () => {
    const steps = postgresCacheTables("cache");
    expect(steps.map((step) => step.statement)).toEqual([
      'create unlogged table "cache"."entries" (key text collate "C" primary key, body text not null, expires_at timestamptz not null)',
      'create index "idx_entries_expires_at" on "cache"."entries" (expires_at)',
      'create unlogged table "cache"."set_members" (set_name text collate "C" not null, member text collate "C" not null, expires_at timestamptz not null, primary key (set_name, member))',
      'create index "idx_set_members_expires_at" on "cache"."set_members" (expires_at)',
    ]);
  });

  it("gives every statement its inverse", () => {
    expect(postgresCacheTables("database").map((step) => step.inverse)).toEqual([
      'drop table "database"."entries"',
      'drop index "database"."idx_entries_expires_at"',
      'drop table "database"."set_members"',
      'drop index "database"."idx_set_members_expires_at"',
    ]);
  });
});

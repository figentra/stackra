/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateSnapshotsMigration`: one transactional step creating `collaboration.snapshots` keyed by
 *          document, with the scope, the state as bytes and the save time.
 * Boundary: test only; compiles the migration, runs no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2); ADR 0159.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateSnapshotsMigration } from "#node/database/migrations/0001-create-snapshots.migration";

describe("CreateSnapshotsMigration", () => {
  const { steps } = compileMigration(CreateSnapshotsMigration, { schema: "collaboration" });
  const sql = (steps[0]?.sql ?? []).join("\n");

  it("creates the snapshot table in one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
    expect(sql).toContain("create table collaboration.snapshots (document varchar(64) primary key");
    expect(sql).toContain("state bytea not null");
  });
});

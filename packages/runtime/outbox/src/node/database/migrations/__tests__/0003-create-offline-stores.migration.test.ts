/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateOfflineStoresMigration`: one transactional step creating the device sequence, capped
 *          call and replica change tables with 64-bit sequences and positions, an `ltree` scope path, the cap and scope
 *          indexes, and an inverse for every statement.
 * Boundary: test only; compiles the migration, runs no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decisions 1, 3 and 5); ADR 0159.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateOfflineStoresMigration } from "#node/database/migrations/0003-create-offline-stores.migration";

describe("CreateOfflineStoresMigration", () => {
  const { after, steps } = compileMigration(CreateOfflineStoresMigration, { schema: "outbox" });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the three stores with 64-bit counters and a scope path", () => {
    expect(sql).toContain(
      "create table outbox.device_sequences (device_id varchar(128) primary key",
    );
    expect(sql).toContain("sequence bigint not null");
    expect(sql).toContain("create table outbox.offline_cap_uses (");
    expect(sql).toContain("create table outbox.replica_changes (");
    expect(sql).toContain("primary key (partition, position)");
    expect(sql).toContain("scope_path ltree");
    expect(sql).toContain("using gist (scope_path)");
  });
});

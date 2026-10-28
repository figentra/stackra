/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresPolicySnapshotStoreDriver` on real Postgres: a snapshot round-trips with its
 *          instants; only a higher version replaces the held one; snapshots are partitioned by tenant (a platform
 *          principal is its own partition); a corrupt row throws on read.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0001 migration creates the table.
 * Runtime: node (vitest)
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0239; ADR 0407; STA-815; ADR 0022; ADR 0269.
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { describe, expect, it } from "@stackra/testing";

import type { PolicySnapshot } from "#contracts/index";
import { CreatePolicySnapshotsMigration } from "#node/database/migrations/0001-create-policy-snapshots.migration";
import { PostgresPolicySnapshotStoreDriver } from "#node/drivers/postgres-policy-snapshot-store.driver";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreatePolicySnapshotsMigration, { schema: "iam", createsSchema: true }),
  ],
});

const PRINCIPAL = "usr_01j9z3k4m5n6p7q8r9s0t1v2r1";

/** A snapshot at `version` with one expiring grant. */
const at = (version: number): PolicySnapshot => ({
  version,
  grants: [
    {
      role: "manager",
      scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" },
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    },
  ],
  roles: { manager: ["orders.order.read"] },
  denies: [],
  visibility: [],
});

/** The store over the test database. */
const store = () => new PostgresPolicySnapshotStoreDriver(postgres.database);

describe(PostgresPolicySnapshotStoreDriver, () => {
  it("round-trips a snapshot and keeps only a higher version", async () => {
    expect(await store().write(PRINCIPAL, at(2), "ten_acme")).toBe(true);
    expect(await store().write(PRINCIPAL, at(2), "ten_acme")).toBe(false);
    expect(await store().write(PRINCIPAL, at(1), "ten_acme")).toBe(false);
    const held = await store().read(PRINCIPAL, "ten_acme");
    expect(held?.version).toBe(2);
    expect(held?.grants[0]?.expiresAt).toEqual(new Date("2027-01-01T00:00:00.000Z"));
    expect(await store().write(PRINCIPAL, at(3), "ten_acme")).toBe(true);
    expect((await store().read(PRINCIPAL, "ten_acme"))?.version).toBe(3);
  });

  it("partitions by tenant, with platform principals on their own", async () => {
    await store().write(PRINCIPAL, at(5), "ten_globex");
    expect(await store().read(PRINCIPAL, "ten_initech")).toBeUndefined();
    expect(await store().read(PRINCIPAL)).toBeUndefined();
    expect(await store().write(PRINCIPAL, at(1))).toBe(true);
    expect((await store().read(PRINCIPAL))?.version).toBe(1);
    expect((await store().read(PRINCIPAL, "ten_globex"))?.version).toBe(5);
  });

  it("throws on a row that is not a policy snapshot", async () => {
    await postgres.database.transaction(async () => {
      const em = postgres.database.em() as unknown as {
        execute: (sql: string, params: readonly unknown[]) => Promise<unknown>;
      };
      await em.execute("select set_config('app.tenant_id', ?, true)", ["ten_corrupt"]);
      await em.execute(
        'insert into "iam"."policy_snapshots" (tenant_id, principal, version, snapshot, created_at, updated_at) values (?, ?, 1, ?::jsonb, now(), now())',
        ["ten_corrupt", PRINCIPAL, JSON.stringify({ version: "x" })],
      );
    });
    await expect(store().read(PRINCIPAL, "ten_corrupt")).rejects.toThrow(TypeError);
  });
});

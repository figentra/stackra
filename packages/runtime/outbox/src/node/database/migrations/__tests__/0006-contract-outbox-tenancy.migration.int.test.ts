/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractOutboxTenancyMigration` on real Postgres, over every outbox migration before
 *          it: the pre-flight refuses a message, a delivery or a change below a tenant node, naming the count and the
 *          remedy (drain the relay; let the change consumers pass), and changes nothing; applied, the backfill gives a
 *          row at a tenant node (nlevel 3) its scope as owner and keeps a row with no scope, at the root or at a product
 *          node a platform row; a dated partition made before the migration is secured with the log's policies, row
 *          security enabled and forced; and `assertRowSecurity`, strict, with the compiled migrations as its directory
 *          (so every `t.systemAccess` and `schema.systemFunction` declaration is held to its grants), finds no gap.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres. One fresh database for
 *           the file with migrations 0001 to 0005 (`ownerPostgres(5)`); the superuser seeds the rows, applies 0006 as a
 *           migrator would, and reads the catalogue. The audit probes with its own NOBYPASSRLS role. Tests run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0347 (decision 5: the catalogue audit); ADR
 *                     0159 (as amended); ADR 0182 (integration tier); `.agents/rules/tenancy.md` (points 7 and 8).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { assertRowSecurity } from "@stackra/database/testing";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import {
  HOST,
  outboxMigrations,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";

/** Two tenants under product alpha, as their scope node ids. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

/** A node below acme: a branch or a child tenant, which the migration cannot tell apart. */
const BRANCH = "scp_01jab3k4m5n6p7q8r9s0t1v2w5";

const NOW = new Date("2026-11-08T12:00:00.000Z");

describe.skipIf(HOST === undefined)("ContractOutboxTenancyMigration on Postgres", () => {
  let postgres: OwnerPostgres;
  const contract = outboxMigrations()[5];

  beforeAll(async () => {
    postgres = await ownerPostgres(5);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds message `id` written at scope `id`/`path` (none: no scope). */
  const seedMessage = (id: string, scope: string | null, path: string | null) =>
    superuser(
      `insert into outbox.messages (id, kind, type, data, meta, occurred_at, attempts, available_at, scope_id, scope_path)
         values (?, 'event', 'orders.order.paid.v1', '{}'::jsonb, '{}'::jsonb, ?, 0, ?, ?, ?::ltree)`,
      [id, NOW, NOW, scope, path],
    );

  /** Seeds a change of Order `id` written at scope `id`/`path`. */
  const seedChange = (id: string, scope: string | null, path: string | null) =>
    superuser(
      `insert into outbox.changes (type, data, meta, occurred_at, scope_id, scope_path)
         values ('Order', ?::jsonb, '{}'::jsonb, ?, ?, ?::ltree)`,
      [JSON.stringify({ model: "Order", id, kind: "created", fields: [] }), NOW, scope, path],
    );

  /** Whether `outbox.messages` holds the owner column yet. */
  const contracted = async () =>
    (
      await superuser(
        "select 1 from information_schema.columns where table_schema = 'outbox' and table_name = 'messages' and column_name = 'tenant_id'",
      )
    ).length > 0;

  it("refuses a message below a tenant node, naming the count and the remedy, and changes nothing", async () => {
    if (contract === undefined) throw new Error("0006 is not compiled");
    await seedMessage("evt_deep", BRANCH, "platform.alpha.acme.north");
    await expect(postgres.apply(contract)).rejects.toThrow(
      /rows with a null tenant_id: outbox\.messages 1\. .*Drain the relay first/,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from outbox.messages");
  });

  it("refuses a change below a tenant node with the change log's remedy", async () => {
    if (contract === undefined) throw new Error("0006 is not compiled");
    await seedChange("ord_deep", BRANCH, "platform.alpha.acme.north");
    await expect(postgres.apply(contract)).rejects.toThrow(
      /outbox\.changes 1\. .*Let every change consumer pass those changes/,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from outbox.changes");
  });

  it("backfills a tenant node's rows and keeps the platform's, and secures a dated partition made before it", async () => {
    if (contract === undefined) throw new Error("0006 is not compiled");
    await seedMessage("evt_acme", ACME, "platform.alpha.acme");
    await seedMessage("evt_product", "scp_01jab3k4m5n6p7q8r9s0t1v2w6", "platform.alpha");
    await seedMessage("evt_root", "scp_01jab3k4m5n6p7q8r9s0t1v2w7", "platform");
    await seedMessage("evt_none", null, null);
    await seedChange("ord_globex", GLOBEX, "platform.alpha.globex");
    await superuser(
      `insert into outbox.deliveries (id, event_id, subscriber, type, envelope, attempts, available_at, created_at)
         values ('dlv_acme', 'evt_acme', 'billing', 'orders.order.paid.v1', ?::jsonb, 0, ?, ?),
                ('dlv_none', 'evt_none', 'billing', 'orders.order.paid.v1', '{}'::jsonb, 0, ?, ?)`,
      [JSON.stringify({ scope: { id: ACME, path: "platform.alpha.acme" } }), NOW, NOW, NOW, NOW],
    );
    await superuser(
      "create table outbox.changes_p20261101 partition of outbox.changes for values from ('2026-11-01') to ('2026-11-02')",
    );
    await postgres.apply(contract);
    expect(await superuser("select id, tenant_id from outbox.messages order by id")).toEqual([
      { id: "evt_acme", tenant_id: ACME },
      { id: "evt_none", tenant_id: null },
      { id: "evt_product", tenant_id: null },
      { id: "evt_root", tenant_id: null },
    ]);
    expect(await superuser("select tenant_id from outbox.changes")).toEqual([
      { tenant_id: GLOBEX },
    ]);
    expect(await superuser("select id, tenant_id from outbox.deliveries order by id")).toEqual([
      { id: "dlv_acme", tenant_id: ACME },
      { id: "dlv_none", tenant_id: null },
    ]);
    expect(
      await superuser(
        "select relrowsecurity as enabled, relforcerowsecurity as forced from pg_class where oid = 'outbox.changes_p20261101'::regclass",
      ),
    ).toEqual([{ enabled: true, forced: true }]);
    expect(
      (
        await superuser(
          "select polname from pg_policy where polrelid = 'outbox.changes_p20261101'::regclass order by polname",
        )
      ).map((row) => row["polname"]),
    ).toEqual([
      "pol_changes_p20261101_tenant_id",
      "pol_changes_p20261101_tenant_id_write_delete",
      "pol_changes_p20261101_tenant_id_write_update",
    ]);
  });

  it("passes the strict row-security audit, its system access held to the compiled declarations", async () => {
    const directory = mkdtempSync(join(tmpdir(), "outbox-migrations-"));
    try {
      for (const [index, migration] of outboxMigrations().entries())
        for (const [part, step] of migration.steps.entries())
          writeFileSync(
            join(
              directory,
              `${String(index * 100 + part + 1).padStart(4, "0")}_outbox_${index + 1}_${part}.up.sql`,
            ),
            `${step.transactional ? "" : "-- stackra:transactional=false\n"}${step.sql.join(";\n")};\n`,
          );
      await expect(
        assertRowSecurity(postgres.database, {
          column: "tenant_id",
          setting: "app.tenant_id",
          role: "outbox_audit_probe",
          probe: [ACME, GLOBEX],
          migrationsDirectory: directory,
          strict: true,
        }),
      ).resolves.toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractWorkflowTenancyMigration` on real Postgres, over every workflow migration
 *          before it (the expand step included): with a row whose `tenant_id` is null the pre-flight refuses, naming
 *          the table's count, and changes nothing; on clean data it applies, each of `automations`, `checklists` and
 *          `checklist_progresses` has `tenant_id` NOT NULL, `pol_<table>_tenant_id` as its one permissive policy and
 *          the scope path restrictive, and `assertRowSecurity` proves one tenant never sees, nor moves a row to,
 *          another's, with no warning for these tables.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The tests share one database and run in order.
 *           The container's superuser writes the null row, as row-level security never restricts it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0239 (2026-11-07 amendment, item 1); ADR 0347
 *                     (decisions 1 to 3 and 5).
 */
import { compileMigration, type CompiledMigration } from "@stackra/database";
import { assertRowSecurity, usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { tenantIsolationOptions } from "@stackra/tenancy/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreateRunsMigration } from "#node/database/migrations/0001-create-runs.migration";
import { AddRunVersionMigration } from "#node/database/migrations/0002-add-run-version.migration";
import { CreateAutomationsMigration } from "#node/database/migrations/0003-create-automations.migration";
import { AddAutomationPublisherMigration } from "#node/database/migrations/0004-add-automation-publisher.migration";
import { CreateServiceAckSetsMigration } from "#node/database/migrations/0005-create-service-ack-sets.migration";
import { CreateChecklistsMigration } from "#node/database/migrations/0006-create-checklists.migration";
import { AddRunAutomationAndCancelMigration } from "#node/database/migrations/0007-add-run-automation-and-cancel.migration";
import { AddServiceAckKeptMigration } from "#node/database/migrations/0008-add-service-ack-kept.migration";
import { RenameChecklistProgressMigration } from "#node/database/migrations/0009-rename-checklist-progress.migration";
import { AddWorkflowTenancyMigration } from "#node/database/migrations/0010-add-workflow-tenancy.migration";
import { ContractWorkflowTenancyMigration } from "#node/database/migrations/0011-contract-workflow-tenancy.migration";

const TABLES = ["automations", "checklists", "checklist_progresses"];

const postgres = usePostgres({
  entities: [],
  migrations: [
    CreateRunsMigration,
    AddRunVersionMigration,
    CreateAutomationsMigration,
    AddAutomationPublisherMigration,
    CreateServiceAckSetsMigration,
    CreateChecklistsMigration,
    AddRunAutomationAndCancelMigration,
    AddServiceAckKeptMigration,
    RenameChecklistProgressMigration,
    AddWorkflowTenancyMigration,
  ].map((migration, index) =>
    compileMigration(migration, {
      schema: "workflow",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  ),
});

const CONTRACT = compileMigration(ContractWorkflowTenancyMigration, {
  schema: "workflow",
  macros: [BelongsToTenantMacro],
});

/** Runs each step of `migration` in its own transaction, as the migration runner does. */
async function apply(migration: CompiledMigration): Promise<void> {
  const { database } = postgres;
  for (const step of migration.steps)
    await database.transaction(async () => {
      // raw-sql: the compiled migration's own statements
      for (const sql of step.sql) await database.em().execute(sql);
    });
}

/** Each contracted table's policies and whether `tenant_id` is NOT NULL. */
async function catalogue(): Promise<unknown[]> {
  // raw-sql: the catalogue's policies and NOT NULL flags of the contracted tables
  return postgres.database.em().execute(
    `select c.relname as "table", a.attnotnull as "notNull",
       array(select p.polname || ':' || case when p.polpermissive then 'permissive' else 'restrictive' end
             from pg_policy p where p.polrelid = c.oid order by p.polname) as policies
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id'
     where n.nspname = 'workflow' and c.relname in ('automations', 'checklists', 'checklist_progresses')
     order by c.relname`,
  );
}

describe("ContractWorkflowTenancyMigration on Postgres", () => {
  it("refuses while a row has no tenant, naming the count, and changes nothing", async () => {
    const before = await catalogue();
    const em = postgres.database.em();
    // raw-sql: an expand-step row written outside any tenant, so its tenant_id stayed null
    await em.execute(
      `insert into "workflow"."checklist_progresses" (id, scope_id, scope_path, checklist_id, step, owner_id, completed_by)
       values ('wfp_01jab3k4m5n6p7q8r9s0t1v2w3', 'scp_01jab3k4m5n6p7q8r9s0t1v2w3', 'platform.acme', 'wfc_01jab3k4m5n6p7q8r9s0t1v2w3', 'connect_payments', 'scp_01jab3k4m5n6p7q8r9s0t1v2w3', '{}')`,
    );
    try {
      await expect(apply(CONTRACT)).rejects.toThrow(
        /refused before any change: rows with a null tenant_id: workflow\.checklist_progresses 1\. Backfill tenant_id/,
      );
      expect(await catalogue()).toEqual(before);
    } finally {
      // raw-sql: removes the null row so the contract can apply
      await em.execute('delete from "workflow"."checklist_progresses"');
    }
  });

  it("applies on clean data: NOT NULL, the one equality and the scope path restrictive", async () => {
    await apply(CONTRACT);
    expect(await catalogue()).toEqual(
      [...TABLES].sort().map((table) => ({
        table,
        notNull: true,
        policies: [`pol_${table}_scope_path:restrictive`, `pol_${table}_tenant_id:permissive`],
      })),
    );
  });

  it("isolates each tenant's rows under assertRowSecurity, with no warning for these tables", async () => {
    const warnings = await assertRowSecurity(postgres.database, {
      ...tenantIsolationOptions(),
      strict: false,
    });
    expect(
      warnings.filter((warning) =>
        TABLES.some((table) => warning.startsWith(`workflow.${table} `)),
      ),
    ).toEqual([]);
  });
});

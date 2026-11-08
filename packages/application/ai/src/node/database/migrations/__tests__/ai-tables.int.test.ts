/**
 * Stackra file contract:
 * Purpose: integration test of the ai package's own migrations under `assertRowSecurity`, the check a host's generated
 *          tenant-isolation test runs: every ai table is owned, forced and isolated by its one permissive
 *          `pol_<table>_tenant_id` policy, with no missing or extra one (0006 renames the two 0005 left).
 * Boundary: test only; integration tier (Docker through `usePostgres`, or the Testbed's `--postgres`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0347; STA-2577.
 */
import { compileMigration, type MigrationClass } from "@stackra/database";
import { assertRowSecurity, usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { tenantIsolationOptions } from "@stackra/tenancy/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreateAiTablesMigration } from "#node/database/migrations/0001-create-ai-tables.migration";
import { DropEmbeddingsMigration } from "#node/database/migrations/0002-drop-embeddings.migration";
import { AppendOnlyAiTablesMigration } from "#node/database/migrations/0003-append-only-ai-tables.migration";
import { AddClientToolParkMigration } from "#node/database/migrations/0004-add-client-tool-park.migration";
import { RunStepsAppendOnlyMigration } from "#node/database/migrations/0005-run-steps-append-only.migration";
import { RenameRunPoliciesMigration } from "#node/database/migrations/0006-rename-run-policies.migration";

/** The ai migrations in their order. */
const MIGRATIONS: readonly MigrationClass[] = [
  CreateAiTablesMigration,
  DropEmbeddingsMigration,
  AppendOnlyAiTablesMigration,
  AddClientToolParkMigration,
  RunStepsAppendOnlyMigration,
  RenameRunPoliciesMigration,
];

const postgres = usePostgres({
  entities: [],
  migrations: MIGRATIONS.map((migration, index) =>
    compileMigration(migration, {
      schema: "ai",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  ),
});

describe("the ai migrations under assertRowSecurity", () => {
  it("isolate every ai table by its one tenant policy", async () => {
    const warnings = await assertRowSecurity(postgres.database, {
      ...tenantIsolationOptions(),
      strict: true,
    });
    expect(warnings).toEqual([]);
  });
});

/**
 * Stackra file contract:
 * Purpose: integration tests of `ChecklistService` on real Postgres: with every workflow migration applied and the
 *          generated entities registered, a checklist is seeded, a step is completed once and the view reads it back,
 *          so the ORM's tables (`workflow.checklists`, `workflow.checklist_progresses`) are the migrations' tables,
 *          tenant expand column included.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. Each call runs in the scope's session, as an
 *           action would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0424 (decisions 1 and 2); ADR 0294 (decision 20).
 */
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { compileMigration, CrudService, registerModelPartners } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { SeedResult } from "#core/index";
import { CreateRunsMigration } from "#node/database/migrations/0001-create-runs.migration";
import { AddRunVersionMigration } from "#node/database/migrations/0002-add-run-version.migration";
import { CreateAutomationsMigration } from "#node/database/migrations/0003-create-automations.migration";
import { AddAutomationPublisherMigration } from "#node/database/migrations/0004-add-automation-publisher.migration";
import { CreateServiceAckSetsMigration } from "#node/database/migrations/0005-create-service-ack-sets.migration";
import { CreateChecklistsMigration } from "#node/database/migrations/0006-create-checklists.migration";
import { AddRunAutomationAndCancelMigration } from "#node/database/migrations/0007-add-run-automation-and-cancel.migration";
import { AddServiceAckKeptMigration } from "#node/database/migrations/0008-add-service-ack-kept.migration";
import { RenameChecklistProgressMigration } from "#node/database/migrations/0009-rename-checklist-progress.migration";
import { AddTenancyMigration } from "#node/database/migrations/0010-add-tenancy.migration";
import { WORKFLOW_ENTITIES } from "#node/entities.gen";
import { Checklist } from "#node/models/checklist.model";
import { ChecklistProgress } from "#node/models/checklist-progress.model";
import { ChecklistService } from "#node/services/checklist.service";

/** The progress repository, as `repositoryOf(ChecklistProgress)` makes it, without its abstract type. */
class ProgressRepository extends CrudService<ChecklistProgress> {}

registerModelPartners([
  [ChecklistService, Checklist],
  [ProgressRepository, ChecklistProgress],
]);

const postgres = usePostgres({
  entities: WORKFLOW_ENTITIES,
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
    AddTenancyMigration,
  ].map((migration, index) =>
    compileMigration(migration, {
      schema: "workflow",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  ),
});

const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

const OWNER: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Staff,
};

const TEMPLATE = {
  key: "workflow-template:commerce:onboarding",
  version: "1.0.0",
  steps: [
    { key: "connect_payments", label: "commerce::onboarding.connect_payments", locked: true },
    { key: "add_product", label: "commerce::onboarding.add_product" },
  ],
};

/** Runs `work` with a fresh service in the scope's session. */
const inScope = <T>(work: (checklists: ChecklistService) => Promise<T>): Promise<T> =>
  postgres.database.withScope(SCOPE, () => work(new ChecklistService(new ProgressRepository())));

describe(ChecklistService, () => {
  it("seeds, completes a step once and reads the progress back from the migrated tables", async () => {
    expect(await inScope((checklists) => checklists.seed(SCOPE, TEMPLATE))).toBe(
      SeedResult.Created,
    );
    const checklist = await inScope((checklists) =>
      checklists.findOneOrFail({ scopeId: SCOPE.id, key: TEMPLATE.key }),
    );

    expect(
      await inScope((checklists) => checklists.complete(checklist.id, "connect_payments", OWNER)),
    ).toBe(true);
    expect(
      await inScope((checklists) => checklists.complete(checklist.id, "connect_payments", OWNER)),
    ).toBe(false);

    const view = await inScope((checklists) => checklists.view(checklist.id, OWNER.id));
    expect(view.done).toBe(1);
    expect(view.complete).toBe(false);

    const { database } = postgres;
    const rows = await database.withScope(SCOPE, () =>
      database
        .em()
        .execute('select step, owner_id, tenant_id from "workflow"."checklist_progresses"'),
    );
    // a scope session with no tenant call leaves the expand column null
    expect(rows).toEqual([{ step: "connect_payments", owner_id: SCOPE.id, tenant_id: null }]);
  });
});

/**
 * Stackra file contract:
 * Purpose: the isolation test of `workflow.run.get` on Postgres (STA-2613): a run journalled in tenant A is read by its
 *          starter in A and by a service in A, and is `run_not_found` for tenant B (its people and its services) and for
 *          another person in A, with the run's scope read back from the journal's own columns.
 * Boundary: int tier; the Postgres journal over every workflow migration, the native engine with memory locks and a
 *           fixed clock. The runs table holds no tenant policy (its rows are read across scopes by the worker), so the
 *           query's scope check is the isolation this test proves.
 * Runtime: node
 * Governing contract: ADR 0101; ADR 0102 (decision 1); ADR 0208; STA-2613.
 */
import type { QueryContext } from "@stackra/actions";
import {
  type Actor,
  ActorKind,
  type Clock,
  type PublicId,
  type ScopeRef,
} from "@stackra/contracts";
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import { RunNotFoundError } from "#core/errors/run-not-found.error";
import type { WorkflowRun } from "#core/types/workflow-run.type";
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
import { PostgresWorkflowJournalDriver } from "#node/drivers/postgres-workflow-journal.driver";
import { GetRunQuery } from "#node/queries/get-run.query";

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
    ContractWorkflowTenancyMigration,
  ].map((migration, index) =>
    compileMigration(migration, {
      schema: "workflow",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  ),
});

/** Two top-level scopes, A and B. */
const SCOPE_A = { id: "scp_01J0000000000000000000000A", path: "a" } as ScopeRef;
const SCOPE_B = { id: "scp_01J0000000000000000000000B", path: "b" } as ScopeRef;

/** The starter, another person, and a service. */
const OWNER = { kind: ActorKind.User, id: "usr_01J00000000000000000000001" } as unknown as Actor;
const OTHER = { kind: ActorKind.User, id: "usr_01J00000000000000000000002" } as unknown as Actor;
const SERVICE = { kind: ActorKind.Service, id: "svc_payments" } as unknown as Actor;

/** The query's context for `actor` in `scope`. */
const ctxOf = (actor: Actor, scope: ScopeRef) => ({ actor, scope }) as unknown as QueryContext;

/** One tenant's run kept from another. */
describe("GetRunQuery on Postgres", () => {
  /** Tenant A's run, journalled with A's scope, is A's alone. */
  it("reads a run for its tenant and starter only", async () => {
    const journal = new PostgresWorkflowJournalDriver(postgres.database);
    const clock = { now: () => new Date(Date.UTC(2026, 10, 8, 12)) } as Clock;
    const runner = new NativeWorkflowRunnerDriver(
      journal,
      new Locks(new MemoryLockDriver(clock), clock),
      clock,
    );
    const runId = "wfr_01J000000000000000000000A1" as PublicId<"wfr">;
    const run: WorkflowRun = {
      id: runId,
      workflow: "payments.charge_payment",
      version: 1,
      status: WorkflowRunStatus.Waiting,
      input: { amount: 10 },
      origin: {
        callId: "call-1",
        key: "payment.charge",
        actor: OWNER,
        scope: SCOPE_A,
        locale: "en",
        timeZone: "UTC",
        currency: "USD",
        market: "default",
      },
      scope: SCOPE_A,
      startedAt: clock.now(),
      steps: [],
    };
    await journal.transaction(SCOPE_A, () => journal.save(run));
    const query = new GetRunQuery(runner);

    // The workflow is not deployed in this process, so the output is null; the status comes from the journal.
    await expect(query.handle({ runId } as never, ctxOf(OWNER, SCOPE_A))).resolves.toMatchObject({
      runId,
      status: WorkflowRunStatus.Waiting,
      output: null,
    });
    await expect(query.handle({ runId } as never, ctxOf(SERVICE, SCOPE_A))).resolves.toMatchObject({
      runId,
    });
    for (const ctx of [ctxOf(OWNER, SCOPE_B), ctxOf(SERVICE, SCOPE_B), ctxOf(OTHER, SCOPE_A)])
      await expect(query.handle({ runId } as never, ctx)).rejects.toBeInstanceOf(RunNotFoundError);
  });
});

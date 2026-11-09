/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresWorkflowJournalDriver`: a transaction is a new one in the run's scope session;
 *          `currentScope` reads the session settings and `currentOwner` the tenant setting; `save` upserts the run,
 *          then its steps in one batch, and never writes the owner; `find` reads the run (its owner included) and its
 *          ordered steps back into a record; `last`, `byAutomation` (newest first, paged by start, its automation read
 *          back), `hold` and `take` are bound statements; `due` and `expired` claim through the system functions and
 *          `remove` deletes by id; every statement binds its values.
 * Boundary: test only; a stand-in database records each statement and the transactions and scopes it opens, and
 *           answers queued rows, so no database runs. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0102 (decision 1); ADR 0160 (bound, zod-typed raw SQL).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { StepStatus, WorkflowJournal, WorkflowRunStatus } from "#core/index";
import type { WorkflowRun } from "#core/index";
import { PostgresWorkflowJournalDriver } from "#node/drivers/postgres-workflow-journal.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const SCOPE: ScopeRef = { id: "scp_1", path: "platform.acme" };

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A stored row of `workflow.runs`. */
const RUN_ROW = {
  id: "wfr_a",
  workflow: "RedeemWorkflow",
  version: 2,
  automation_id: null,
  status: "waiting",
  input: { points: 300 },
  origin: { callId: "call-1", key: "points.redeem", actor: { kind: "system", id: "sys_test" } },
  error: null,
  scope_id: "scp_1",
  scope_path: "platform.acme",
  tenant_id: "scp_1",
  started_at: NOON,
  deadline_at: NOON,
  ended_at: null,
};

/** A stored row of `workflow.steps`. */
const STEP_ROW = {
  name: "confirm",
  status: "waiting",
  attempts: 0,
  result: null,
  error: null,
  progress: null,
  signal: "Confirmed",
  correlation: '{"memberId":"mem_1"}',
  wake_at: NOON,
  started_at: NOON,
  ended_at: null,
};

/** A stored row of `workflow.signals`. */
const SIGNAL_ROW = {
  id: "wfs_a",
  signal: "Confirmed",
  correlation: '{"memberId":"mem_1"}',
  payload: { by: "usr_1" },
  scope_id: null,
  scope_path: null,
  received_at: NOON,
  expires_at: NOON,
};

/** A run to save. */
const RUN: WorkflowRun = {
  id: "wfr_a",
  workflow: "RedeemWorkflow",
  status: WorkflowRunStatus.Running,
  input: { points: 300 },
  origin: {
    callId: "call-1",
    key: "points.redeem",
    actor: { kind: "system", id: "sys_test" },
    locale: "en",
    timeZone: "UTC",
    currency: "USD",
    market: "default",
  },
  scope: SCOPE,
  startedAt: NOON,
  steps: [
    {
      name: "quote",
      status: StepStatus.Done,
      attempts: 1,
      result: { points: 300 },
      startedAt: NOON,
    },
  ],
};

/** A database that records statements, transactions and scopes, and answers `answers` in order. */
function databaseWith(...answers: readonly (readonly object[])[]) {
  const statements: Statement[] = [];
  const opened: { readonly requiresNew: boolean | undefined; readonly scope: unknown }[] = [];
  const queue = [...answers];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return queue.shift() ?? [];
    },
  };
  const database = {
    em: () => em,
    transaction: async <T>(
      work: () => Promise<T>,
      options?: { readonly requiresNew?: boolean },
    ) => {
      opened.push({ requiresNew: options?.requiresNew, scope: undefined });
      return work();
    },
    withScope: async <T>(scope: unknown, work: () => Promise<T>) => {
      opened.push({ requiresNew: undefined, scope });
      return work();
    },
  } as unknown as Database;
  return { database, statements, opened };
}

/** Asserts every statement binds its values: one placeholder per parameter, no value in the text. */
function expectBound(statements: readonly Statement[]): void {
  for (const statement of statements) {
    expect(statement.sql.split("?")).toHaveLength(statement.params.length + 1);
    for (const value of ["wfr_a", "scp_1", "mem_1", "usr_1", "RedeemWorkflow"])
      expect(statement.sql).not.toContain(value);
  }
}

describe(PostgresWorkflowJournalDriver, () => {
  it("is a WorkflowJournal", () => {
    expect(new PostgresWorkflowJournalDriver({} as Database)).toBeInstanceOf(WorkflowJournal);
  });

  it("runs work in a new transaction with the scope's session", async () => {
    const { database, opened } = databaseWith();
    const journal = new PostgresWorkflowJournalDriver(database);
    expect(await journal.transaction(SCOPE, async () => 7)).toBe(7);
    await journal.transaction(undefined, async () => 8);
    expect(opened).toEqual([
      { requiresNew: true, scope: undefined },
      { requiresNew: undefined, scope: SCOPE },
      { requiresNew: true, scope: undefined },
      { requiresNew: undefined, scope: [] },
    ]);
  });

  it("reads the session's scope", async () => {
    const { database } = databaseWith(
      [{ scope_id: "scp_1", scope_path: "platform.acme" }],
      [{ scope_id: null, scope_path: null }],
    );
    const journal = new PostgresWorkflowJournalDriver(database);
    expect(await journal.currentScope()).toEqual(SCOPE);
    expect(await journal.currentScope()).toBeUndefined();
  });

  it("reads the session's owner, an empty setting as none", async () => {
    const { database, statements } = databaseWith([{ owner: "scp_1" }], [{ owner: null }]);
    const journal = new PostgresWorkflowJournalDriver(database);
    expect(await journal.currentOwner()).toBe("scp_1");
    expect(await journal.currentOwner()).toBeUndefined();
    expect(statements[0]?.sql).toContain("nullif(current_setting('app.tenant_id', true), '')");
  });

  it("upserts the run, then all its steps in one batch", async () => {
    const { database, statements } = databaseWith();
    await new PostgresWorkflowJournalDriver(database).save(RUN);
    expect(statements).toHaveLength(2);
    expect(statements[0]?.sql).toContain('insert into "workflow"."runs"');
    expect(statements[0]?.sql).toContain("on conflict (id) do update");
    // the owner comes from the column's default (the session's tenant), never from the record
    for (const statement of statements) expect(statement.sql).not.toContain("tenant_id");
    // a run journaled without a version is pinned to version 1
    expect(statements[0]?.params.slice(0, 5)).toEqual([
      "wfr_a",
      "RedeemWorkflow",
      1,
      null,
      "running",
    ]);
    expect(statements[1]?.sql).toContain('insert into "workflow"."steps"');
    expect(statements[1]?.sql).toContain("jsonb_to_recordset(?::jsonb)");
    expect(JSON.parse(String(statements[1]?.params[1]))).toEqual([
      expect.objectContaining({
        name: "quote",
        position: 0,
        status: "done",
        result: { points: 300 },
      }),
    ]);
    expectBound(statements);
  });

  it("reads a run and its steps back into a record", async () => {
    const { database, statements } = databaseWith([RUN_ROW], [STEP_ROW]);
    const run = await new PostgresWorkflowJournalDriver(database).find("wfr_a");
    expect(run).toEqual({
      id: "wfr_a",
      workflow: "RedeemWorkflow",
      version: 2,
      status: WorkflowRunStatus.Waiting,
      input: { points: 300 },
      origin: RUN_ROW.origin,
      scope: SCOPE,
      ownerId: "scp_1",
      startedAt: NOON,
      deadlineAt: NOON,
      steps: [
        {
          name: "confirm",
          status: StepStatus.Waiting,
          attempts: 0,
          signal: "Confirmed",
          correlation: '{"memberId":"mem_1"}',
          wakeAt: NOON,
          startedAt: NOON,
        },
      ],
    });
    expect(statements[1]?.sql).toContain("order by position");
    expectBound(statements);
  });

  it("finds nothing for an unknown run", async () => {
    const { database } = databaseWith([]);
    expect(await new PostgresWorkflowJournalDriver(database).find("wfr_missing")).toBeUndefined();
  });

  it("finds the latest run of a workflow by start, then id", async () => {
    const { database, statements } = databaseWith([{ id: "wfr_a" }], [RUN_ROW], [STEP_ROW]);
    expect((await new PostgresWorkflowJournalDriver(database).last("RedeemWorkflow"))?.id).toBe(
      "wfr_a",
    );
    expect(statements[0]?.sql).toContain("order by started_at desc, id desc limit 1");
    expectBound(statements);
  });

  it("lists an automation's runs newest first, paged by start, with the automation read back", async () => {
    const { database, statements } = databaseWith(
      [{ id: "wfr_a" }],
      [{ ...RUN_ROW, automation_id: "wfa_1" }],
      [STEP_ROW],
    );
    const runs = await new PostgresWorkflowJournalDriver(database).byAutomation("wfa_1", 20, NOON);
    expect(runs.map((run) => [run.id, run.automation])).toEqual([["wfr_a", "wfa_1"]]);
    expect(statements[0]?.sql).toContain("where automation_id = ?");
    expect(statements[0]?.sql).toContain("order by started_at desc, id desc limit ?");
    expect(statements[0]?.params).toEqual(["wfa_1", NOON, NOON, 20]);
    expectBound(statements);
  });

  it("holds and takes a signal with bound statements, matching the scope", async () => {
    const { database, statements } = databaseWith([], [SIGNAL_ROW]);
    const journal = new PostgresWorkflowJournalDriver(database);
    await journal.hold({
      id: "wfs_a",
      signal: "Confirmed",
      correlation: '{"memberId":"mem_1"}',
      payload: { by: "usr_1" },
      scope: SCOPE,
      receivedAt: NOON,
      expiresAt: NOON,
    });
    const taken = await journal.take("Confirmed", '{"memberId":"mem_1"}', SCOPE, NOON);
    expect(taken).toEqual({
      id: "wfs_a",
      signal: "Confirmed",
      correlation: '{"memberId":"mem_1"}',
      payload: { by: "usr_1" },
      receivedAt: NOON,
      expiresAt: NOON,
    });
    expect(statements[1]?.sql).toContain("for update skip locked");
    expect(statements[1]?.sql).toContain("scope_id is not distinct from ?");
    expect(statements[1]?.params).toEqual(["Confirmed", '{"memberId":"mem_1"}', "scp_1", NOON]);
    expectBound(statements);
  });

  it("claims due runs and lapsed signals through the system functions, and removes signals by id", async () => {
    const { database, statements } = databaseWith(
      [
        { id: "wfr_a", tenant_id: "scp_1", started_at: NOON },
        { id: "wfr_b", tenant_id: null, started_at: NOON },
      ],
      [{ id: "wfs_a", tenant_id: null }],
    );
    const journal = new PostgresWorkflowJournalDriver(database);
    expect(await journal.due(NOON, 100)).toEqual([
      { id: "wfr_a", ownerId: "scp_1", startedAt: NOON },
      { id: "wfr_b", startedAt: NOON },
    ]);
    expect(await journal.expired(NOON, 50)).toEqual([{ id: "wfs_a" }]);
    await journal.remove(["wfs_a"]);
    await journal.remove([]);
    expect(statements.map((statement) => statement.sql)).toEqual([
      "select id, tenant_id, started_at from workflow.claim_due_runs(?, ?)",
      "select id, tenant_id from workflow.claim_expired_signals(?, ?)",
      'delete from "workflow"."signals" where id in (select jsonb_array_elements_text(?::jsonb))',
    ]);
    expect(statements.map((statement) => statement.params)).toEqual([
      [NOON, 100],
      [NOON, 50],
      ['["wfs_a"]'],
    ]);
  });
});

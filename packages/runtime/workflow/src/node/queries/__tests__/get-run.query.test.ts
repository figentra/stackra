/**
 * Stackra file contract:
 * Purpose: proves `workflow.run.get` (STA-2613): the person who started a run, an agent acting for them and a service
 *          read its status and its workflow's output, a parked retry answering `waiting` and its output so far; another
 *          person, another tenant (a service included) and an unknown id get `run_not_found` alike; the answer holds
 *          the status, the end time and the output only.
 * Boundary: unit tier; the native engine over the memory journal and memory locks, a fixed clock and fixed instances.
 * Runtime: node
 * Governing contract: ADR 0101; ADR 0208; STA-2613.
 */
import type { QueryContext, Resolver } from "@stackra/actions";
import {
  type Actor,
  ActorKind,
  type Clock,
  type PublicId,
  type ScopeRef,
} from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";

import { Workflow } from "#core/bases/workflow.base";
import { Step } from "#core/decorators/step.decorator";
import { MemoryWorkflowJournalDriver } from "#core/drivers/memory-workflow-journal.driver";
import { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import { RunNotFoundError } from "#core/errors/run-not-found.error";
import type { Run } from "#core/types/run.type";
import { GetRunQuery } from "#node/queries/get-run.query";

/** Noon on a fixed day. */
const NOON = new Date(Date.UTC(2026, 10, 8, 12));

/** Scope A's root, one of its branches, and another root, B. */
const SCOPE_A = { id: "scp_01J0000000000000000000000A", path: "a" } as ScopeRef;
const BRANCH_OF_A = { id: "scp_01J0000000000000000000000C", path: "a.c" } as ScopeRef;
const SCOPE_B = { id: "scp_01J0000000000000000000000B", path: "b" } as ScopeRef;

/** The person who starts the run, another person in the same tenant, a service and an agent acting for the person. */
const OWNER = { kind: ActorKind.User, id: "usr_01J00000000000000000000001" } as unknown as Actor;
const OTHER = { kind: ActorKind.User, id: "usr_01J00000000000000000000002" } as unknown as Actor;
const SERVICE = { kind: ActorKind.Service, id: "svc_payments" } as unknown as Actor;
const AGENT = {
  kind: ActorKind.Agent,
  id: "agt_01J00000000000000000000001",
  onBehalfOf: OWNER,
} as unknown as Actor;

/** A charge whose one step fails once, retryably, before it succeeds. */
class ChargeWorkflow extends Workflow<{ readonly amount: number }>({}) {
  /** Failures still to throw. */
  failures = 1;

  @Step({ retry: { attempts: 2 } })
  async charge(): Promise<string> {
    if (this.failures > 0) {
      this.failures -= 1;
      throw new TypeError("provider timeout");
    }
    return "pay_1";
  }

  output(run: Run<this>): { paymentId: string | null } {
    return { paymentId: run.results.charge ?? null };
  }
}

/** An engine at noon over a memory journal, its run started by `OWNER` in `BRANCH_OF_A`. */
async function started(): Promise<{ runner: NativeWorkflowRunnerDriver; runId: PublicId<"wfr"> }> {
  const clock = { now: () => new Date(NOON) } as Clock;
  const runner = new NativeWorkflowRunnerDriver(
    new MemoryWorkflowJournalDriver(),
    new Locks(new MemoryLockDriver(clock), clock),
    clock,
  );
  const workflow = new ChargeWorkflow();
  runner.connect({
    has: (token: unknown) => token === ChargeWorkflow,
    get: () => workflow,
  } as unknown as Resolver);
  await runner.start(
    ChargeWorkflow,
    { amount: 10 },
    {
      callId: "call-1",
      key: "payment.charge",
      actor: OWNER,
      scope: BRANCH_OF_A,
      locale: "en",
      timeZone: "UTC",
      currency: "USD",
      market: "default",
    },
  );
  const run = await runner.last(ChargeWorkflow);
  return { runner, runId: run?.id as PublicId<"wfr"> };
}

/** The query's context for `actor` in `scope`. */
const ctxOf = (actor: Actor, scope?: ScopeRef) => ({ actor, scope }) as unknown as QueryContext;

/** The run read for its caller. */
describe(GetRunQuery, () => {
  /** A parked retry answers waiting, then the completed output once a tick ran the attempt. */
  it("answers its starter the status and the output so far, then the completed output", async () => {
    const { runner, runId } = await started();
    const query = new GetRunQuery(runner);

    const parked = await query.handle({ runId } as never, ctxOf(OWNER, SCOPE_A));
    expect({ ...parked }).toEqual({
      runId,
      status: WorkflowRunStatus.Waiting,
      endedAt: null,
      output: { paymentId: null },
    });

    await runner.tick(new Date(NOON.getTime() + 60_000));
    const done = await query.handle({ runId } as never, ctxOf(OWNER, BRANCH_OF_A));
    expect(done).toMatchObject({
      status: WorkflowRunStatus.Completed,
      output: { paymentId: "pay_1" },
    });
    expect(done.endedAt).toBeInstanceOf(Date);
  });

  /** The starter's agent and a service of the tenant read it too. */
  it("answers an agent acting for the starter and a service in the tenant", async () => {
    const { runner, runId } = await started();
    const query = new GetRunQuery(runner);

    await expect(query.handle({ runId } as never, ctxOf(AGENT, SCOPE_A))).resolves.toMatchObject({
      runId,
    });
    await expect(query.handle({ runId } as never, ctxOf(SERVICE, SCOPE_A))).resolves.toMatchObject({
      runId,
    });
  });

  /** Another person, another tenant (even a service there), no scope and an unknown id all read as not found. */
  it("refuses another person, another tenant and an unknown id alike", async () => {
    const { runner, runId } = await started();
    const query = new GetRunQuery(runner);

    for (const ctx of [
      ctxOf(OTHER, SCOPE_A),
      ctxOf(OWNER, SCOPE_B),
      ctxOf(SERVICE, SCOPE_B),
      ctxOf(OWNER),
    ])
      await expect(query.handle({ runId } as never, ctx)).rejects.toBeInstanceOf(RunNotFoundError);
    await expect(
      query.handle({ runId: "wfr_01J00000000000000000000099" } as never, ctxOf(OWNER, SCOPE_A)),
    ).rejects.toBeInstanceOf(RunNotFoundError);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryWorkflowJournalDriver`: it is a `WorkflowJournal`; `save` and `find` keep a copy;
 *          `last` is the latest start, the greater id within one instant; `byAutomation` lists one
 *          automation's runs newest first and pages by start; `take` removes the oldest held signal of the
 *          same key, correlation and scope that arrived in time; `due` lists running and compensating runs and waiting
 *          runs whose deadline, wait or signal came; `expire` drops lapsed signals; there is no transaction or scope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0102 (decision 1).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MemoryWorkflowJournalDriver } from "#core/drivers/memory-workflow-journal.driver";
import { StepStatus } from "#core/enums/step-status.enum";
import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import { WorkflowJournal } from "#core/ports/workflow-journal.port";
import type { HeldSignal } from "#core/types/held-signal.type";
import type { WorkflowRun } from "#core/types/workflow-run.type";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const LATER = new Date(NOON.getTime() + 60_000);

const SCOPE: ScopeRef = { id: "scp_1", path: "platform.acme" };

/** A run of `RedeemWorkflow` started at `at`. */
function runOf(id: PublicId<"wfr">, fields: Partial<WorkflowRun> = {}): WorkflowRun {
  return {
    id,
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
    startedAt: NOON,
    steps: [],
    ...fields,
  };
}

/** A run parked on `confirmed` with correlation `c1`. */
function waitingRun(id: PublicId<"wfr">, fields: Partial<WorkflowRun> = {}): WorkflowRun {
  return runOf(id, {
    status: WorkflowRunStatus.Waiting,
    steps: [
      {
        name: "confirm",
        status: StepStatus.Waiting,
        attempts: 0,
        signal: "Confirmed",
        correlation: "c1",
        wakeAt: LATER,
        startedAt: NOON,
      },
    ],
    ...fields,
  });
}

/** A signal held at `at`. */
function heldSignal(id: PublicId<"wfs">, fields: Partial<HeldSignal> = {}): HeldSignal {
  return {
    id,
    signal: "Confirmed",
    correlation: "c1",
    payload: { by: "usr_1" },
    receivedAt: NOON,
    expiresAt: LATER,
    ...fields,
  };
}

describe(MemoryWorkflowJournalDriver, () => {
  it("is a WorkflowJournal with no transaction and no scope session", async () => {
    const journal = new MemoryWorkflowJournalDriver();
    expect(journal).toBeInstanceOf(WorkflowJournal);
    expect(await journal.transaction(SCOPE, async () => 7)).toBe(7);
    expect(await journal.currentScope()).toBeUndefined();
  });

  it("keeps a copy of each saved run", async () => {
    const journal = new MemoryWorkflowJournalDriver();
    const run = runOf("wfr_a");
    await journal.save(run);
    const found = await journal.find("wfr_a");
    expect(found).toEqual(run);
    expect(found).not.toBe(run);
    expect(await journal.find("wfr_missing")).toBeUndefined();
  });

  it("gives the latest run of a workflow, the greater id within one instant", async () => {
    const journal = new MemoryWorkflowJournalDriver();
    await journal.save(runOf("wfr_b"));
    await journal.save(runOf("wfr_a"));
    expect((await journal.last("RedeemWorkflow"))?.id).toBe("wfr_b");
    await journal.save(runOf("wfr_c", { startedAt: LATER }));
    expect((await journal.last("RedeemWorkflow"))?.id).toBe("wfr_c");
    expect(await journal.last("OtherWorkflow")).toBeUndefined();
  });

  it("lists an automation's runs newest first, the greater id within one instant, before a start", async () => {
    const journal = new MemoryWorkflowJournalDriver();
    await journal.save(runOf("wfr_a", { automation: "wfa_1" }));
    await journal.save(runOf("wfr_b", { automation: "wfa_1" }));
    await journal.save(runOf("wfr_c", { automation: "wfa_1", startedAt: LATER }));
    await journal.save(runOf("wfr_d", { automation: "wfa_2" }));
    await journal.save(runOf("wfr_e"));
    expect((await journal.byAutomation("wfa_1", 10)).map((run) => run.id)).toEqual([
      "wfr_c",
      "wfr_b",
      "wfr_a",
    ]);
    expect((await journal.byAutomation("wfa_1", 1, LATER)).map((run) => run.id)).toEqual(["wfr_b"]);
  });

  it("takes the oldest matching signal once, of the same scope, arrived in time", async () => {
    const journal = new MemoryWorkflowJournalDriver();
    await journal.hold(heldSignal("wfs_late", { receivedAt: LATER }));
    await journal.hold(heldSignal("wfs_scoped", { scope: SCOPE }));
    await journal.hold(heldSignal("wfs_first"));
    expect((await journal.take("Confirmed", "c1", undefined, NOON))?.id).toBe("wfs_first");
    expect(await journal.take("Confirmed", "c1", undefined, NOON)).toBeUndefined();
    expect((await journal.take("Confirmed", "c1", SCOPE, NOON))?.id).toBe("wfs_scoped");
    expect(await journal.take("Confirmed", "c2", undefined, LATER)).toBeUndefined();
    expect((await journal.take("Confirmed", "c1", undefined, LATER))?.id).toBe("wfs_late");
  });

  it("lists active runs and waiting runs whose deadline, wait or signal came", async () => {
    const journal = new MemoryWorkflowJournalDriver();
    await journal.save(runOf("wfr_running"));
    await journal.save(runOf("wfr_compensating", { status: WorkflowRunStatus.Compensating }));
    await journal.save(runOf("wfr_done", { status: WorkflowRunStatus.Completed }));
    await journal.save(waitingRun("wfr_waiting"));
    await journal.save(waitingRun("wfr_overdue", { deadlineAt: NOON }));
    expect(await journal.due(NOON, 10)).toEqual(["wfr_running", "wfr_compensating", "wfr_overdue"]);
    expect(await journal.due(LATER, 10)).toEqual([
      "wfr_running",
      "wfr_compensating",
      "wfr_waiting",
      "wfr_overdue",
    ]);
    await journal.hold(heldSignal("wfs_1"));
    expect(await journal.due(NOON, 2)).toEqual(["wfr_running", "wfr_compensating"]);
    expect(await journal.due(NOON, 10)).toContain("wfr_waiting");
  });

  it("drops lapsed signals", async () => {
    const journal = new MemoryWorkflowJournalDriver();
    await journal.hold(heldSignal("wfs_1"));
    await journal.expire(LATER);
    expect(await journal.take("Confirmed", "c1", undefined, LATER)).toBeUndefined();
  });
});

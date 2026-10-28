/**
 * Stackra file contract:
 * Purpose: `MemoryWorkflowJournalDriver`, the `WorkflowJournal` of a test or a single process: runs and held signals in
 *          process memory, each stored as a copy, listed in the order the Postgres journal lists them.
 * Boundary: no transaction (`transaction` runs the work as it is) and no scope session (`currentScope` is
 *           `undefined`), so a write whose caller rolls back stays; the Postgres driver is the transactional one. A run
 *           and a signal keep the scope they are given, and `take` matches it.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 1); ADR 0142 (drivers behind ports); ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import { StepStatus } from "#core/enums/step-status.enum";
import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import { WorkflowJournal } from "#core/ports/workflow-journal.port";
import type { HeldSignal } from "#core/types/held-signal.type";
import type { WorkflowRun } from "#core/types/workflow-run.type";

/** Whether two scopes are the same node, or both absent. */
const sameScope = (left: ScopeRef | undefined, right: ScopeRef | undefined): boolean =>
  left?.id === right?.id;

/**
 * Keeps a workflow journal in memory.
 *
 * @example
 * const journal = new MemoryWorkflowJournalDriver();
 * const runner = new NativeWorkflowRunnerDriver(journal, locks, clock);
 */
export class MemoryWorkflowJournalDriver extends Driver(WorkflowJournal) {
  /** Run id to run, in insertion order. */
  private readonly runs = new Map<string, WorkflowRun>();

  /** Held signals, oldest first. */
  private signals: HeldSignal[] = [];

  /** See `WorkflowJournal.transaction`: the work as it is. */
  transaction<T>(_scope: ScopeRef | undefined, work: () => Promise<T>): Promise<T> {
    return work();
  }

  /** See `WorkflowJournal.currentScope`: memory has no session. */
  currentScope(): Promise<ScopeRef | undefined> {
    return Promise.resolve(undefined);
  }

  /** See `WorkflowJournal.save`: inserts or updates the run and each of its steps. */
  save(run: WorkflowRun): Promise<void> {
    this.runs.set(run.id, structuredClone(run));
    return Promise.resolve();
  }

  /** See `WorkflowJournal.find`: the run with its steps in the order they were reached. */
  find(id: PublicId<"wfr">): Promise<WorkflowRun | undefined> {
    const run = this.runs.get(id);
    return Promise.resolve(run === undefined ? undefined : structuredClone(run));
  }

  /** See `WorkflowJournal.last`: the latest start, and the greater id within one instant (ids grow with time). */
  last(workflow: string): Promise<WorkflowRun | undefined> {
    let latest: WorkflowRun | undefined;
    for (const run of this.runs.values())
      if (
        run.workflow === workflow &&
        (latest === undefined ||
          run.startedAt.getTime() > latest.startedAt.getTime() ||
          (run.startedAt.getTime() === latest.startedAt.getTime() && run.id > latest.id))
      )
        latest = run;
    return Promise.resolve(latest === undefined ? undefined : structuredClone(latest));
  }

  /** See `WorkflowJournal.byAutomation`: one page of the automation's runs, newest start first. */
  byAutomation(
    automation: PublicId<"wfa">,
    limit: number,
    before?: Date,
  ): Promise<readonly WorkflowRun[]> {
    const runs = [...this.runs.values()]
      .filter(
        (run) =>
          run.automation === automation &&
          (before === undefined || run.startedAt.getTime() < before.getTime()),
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(
        (left, right) =>
          right.startedAt.getTime() - left.startedAt.getTime() || (right.id > left.id ? 1 : -1),
      );
    return Promise.resolve(runs.slice(0, limit).map((run) => structuredClone(run)));
  }

  /** See `WorkflowJournal.hold`: keeps the signal until a waiting run takes it. */
  hold(signal: HeldSignal): Promise<void> {
    this.signals.push(structuredClone(signal));
    return Promise.resolve();
  }

  /** See `WorkflowJournal.take`: removes and returns the oldest matching held signal. */
  take(
    signal: string,
    correlation: string,
    scope: ScopeRef | undefined,
    before: Date,
  ): Promise<HeldSignal | undefined> {
    const index = this.signals.findIndex(
      (held) =>
        held.signal === signal &&
        held.correlation === correlation &&
        sameScope(held.scope, scope) &&
        held.receivedAt.getTime() <= before.getTime(),
    );
    const [taken] = index === -1 ? [] : this.signals.splice(index, 1);
    return Promise.resolve(taken);
  }

  /** See `WorkflowJournal.due`: the runs to advance now, oldest first. */
  due(now: Date, limit: number): Promise<readonly PublicId<"wfr">[]> {
    const at = now.getTime();
    const ids = [...this.runs.values()]
      .filter((run) => {
        if (run.status === WorkflowRunStatus.Running) return true;
        if (run.status === WorkflowRunStatus.Compensating) return true;
        if (run.status !== WorkflowRunStatus.Waiting) return false;
        if (run.deadlineAt !== undefined && run.deadlineAt.getTime() <= at) return true;
        return run.steps.some(
          (step) =>
            step.status === StepStatus.Waiting &&
            ((step.wakeAt !== undefined && step.wakeAt.getTime() <= at) ||
              this.signals.some(
                (held) =>
                  held.signal === step.signal &&
                  held.correlation === step.correlation &&
                  sameScope(held.scope, run.scope),
              )),
        );
      })
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())
      .map((run) => run.id);
    return Promise.resolve(ids.slice(0, limit));
  }

  /** See `WorkflowJournal.expire`: drops the held signals that lapsed. */
  expire(now: Date): Promise<void> {
    this.signals = this.signals.filter((held) => held.expiresAt.getTime() > now.getTime());
    return Promise.resolve();
  }
}

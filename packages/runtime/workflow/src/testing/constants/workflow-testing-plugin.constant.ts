/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_TESTING_PLUGIN`, the testing-module plugin of @stackra/workflow: on every `compile()` it connects
 *          the app's native engine (or an in-process one on the memory journal) to the app, makes it the one
 *          `runWorkflow` and `signal` act on, and adds `app.workflows.last(W)` and `app.workflows.advanceClock(d)`.
 *          Declared on `TestingApp` here and registered when this module loads.
 * Boundary: uses the app's own `WorkflowRunner` when it is the native engine (so a run `ctx.run` started is the one
 *           inspected), else an engine over the app's `WorkflowJournal` and `Locks` when it binds them, else memory
 *           ones, on the app's clock. Each compile replaces the current engine.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0263 (decision 12); the STA-348 registry row (in-process test driver).
 */
import { WorkflowRunner } from "@stackra/actions/contracts";
import type { AnyClass } from "@stackra/container";
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingPlugin } from "@stackra/container/testing";
import { Clock, Duration } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { duration } from "@stackra/validation";

import {
  MemoryWorkflowJournalDriver,
  NativeWorkflowRunnerDriver,
  WorkflowJournal,
} from "#core/index";
import type { Workflow, WorkflowRun } from "#core/index";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import { advanceWorkflows } from "#testing/functions/advance-workflows.function";

declare module "@stackra/container/testing" {
  interface TestingApp {
    /** The workflow runs of this app. */
    readonly workflows: {
      /**
       * The latest run of `type`, with its steps.
       * @throws Error when `type` never ran in this app.
       */
      last(type: AnyClass<Workflow>): Promise<WorkflowRun>;

      /** Moves the engine's time on by `duration` (`"16m"`), then resumes and times out what became due. */
      advanceClock(duration: string): Promise<void>;
    };
  }
}

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * const app = await createTestingModule(CommerceModule).useDrivers("memory").compile();
 * await run(RedeemPointsAction, input, { as });
 * await app.workflows.advanceClock("16m");
 * expect((await app.workflows.last(RedeemPointsWorkflow)).status).toBe(WorkflowRunStatus.Compensated);
 */
export const WORKFLOW_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/workflow",
  app(app: TestingApp) {
    const clock = app.get(Clock);
    const bound = app.has(WorkflowRunner) ? app.get(WorkflowRunner) : undefined;
    const runner =
      bound instanceof NativeWorkflowRunnerDriver
        ? bound
        : new NativeWorkflowRunnerDriver(
            app.has(WorkflowJournal) ? app.get(WorkflowJournal) : new MemoryWorkflowJournalDriver(),
            app.has(Locks) ? app.get(Locks) : new Locks(new MemoryLockDriver(clock), clock),
            clock,
          );
    runner.connect(app);
    CURRENT_WORKFLOWS.value = { runner, clock, offset: 0 };
    return {
      workflows: {
        last: async (type: AnyClass<Workflow>): Promise<WorkflowRun> => {
          const run = await runner.last(type);
          if (run === undefined) throw new Error(`${type.name} has no run in this testing app`);
          return run;
        },
        advanceClock: (text: string): Promise<void> =>
          advanceWorkflows(Duration.toMilliseconds(duration(text))),
      },
    };
  },
};

registerTestingPlugin(WORKFLOW_TESTING_PLUGIN);

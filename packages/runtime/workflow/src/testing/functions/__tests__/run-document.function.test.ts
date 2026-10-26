/**
 * Stackra file contract:
 * Purpose: unit tests of `runDocument`: it runs a document on the current testing app's engine through the app's
 *          action pipeline as the test actor and resolves to its journal record, or to the refusal of a failing step
 *          with the compensated record; a document that does not check rejects; it refuses before any app compiled.
 * Boundary: test only; the plugin compiles a stand-in testing app that binds the clock and a recording pipeline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0427 (decision 4).
 */
import { Action, ActionPipeline } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";
import type { TestingApp } from "@stackra/container/testing";
import { ActorKind, Clock } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AutomationInvalidError, BlockKind, registerBlocks, StepStatus } from "#core/index";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import { WORKFLOW_TESTING_PLUGIN } from "#testing/constants/workflow-testing-plugin.constant";
import { runDocument } from "#testing/functions/run-document.function";

const clock = { now: () => new Date(Date.UTC(2026, 9, 26, 12)) } as Clock;

class QuotaExceededError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {}

class NotifyAction extends Action({
  key: "notify.send",
  actors: [ActorKind.System],
}) {
  async handle(): Promise<void> {}
}

registerBlocks([
  { key: "notify.send", kind: BlockKind.Action, type: NotifyAction, label: "notify::blocks.send" },
]);

/** A plan of two notifications. */
const PLAN = {
  key: "ai.notify_twice",
  steps: [
    { name: "first", block: "notify.send", input: { text: { $ref: "input.text" } } },
    { name: "second", block: "notify.send", input: { text: "again" } },
  ],
};

/** Compiles a stand-in testing app whose pipeline records each call and refuses the call numbered `refuseAt`. */
function compileWith(refuseAt?: number): { readonly inputs: unknown[] } {
  const inputs: unknown[] = [];
  const pipeline = {
    execute: async (_type: unknown, input: unknown) => {
      inputs.push(input);
      if (inputs.length === refuseAt) throw QuotaExceededError.create();
      return { sent: inputs.length };
    },
  };
  const bound = (token: AnyClass): object | undefined =>
    token === Clock ? clock : token === ActionPipeline ? pipeline : undefined;
  WORKFLOW_TESTING_PLUGIN.app?.({
    has: (token: AnyClass) => bound(token) !== undefined,
    get: (token: AnyClass) => bound(token),
  } as unknown as TestingApp);
  return { inputs };
}

describe(runDocument, () => {
  it("runs each step through the app's pipeline and resolves to the journal record", async () => {
    const { inputs } = compileWith();
    const result = await runDocument(PLAN, { text: "hello" });
    expect(result.ok).toBe(true);
    expect(inputs).toEqual([{ text: "hello" }, { text: "again" }]);
    expect(result.run.steps.map((step) => step.status)).toEqual([StepStatus.Done, StepStatus.Done]);
    expect(result.run.origin.actor).toEqual({ kind: "system", id: "sys_test" });
  });

  it("resolves to the refusal of a failing step with the record", async () => {
    compileWith(2);
    const result = await runDocument(PLAN, { text: "hello" }, { key: "plan-1" });
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(QuotaExceededError);
    expect(result.run.steps.map((step) => step.status)).toEqual([
      StepStatus.Done,
      StepStatus.Failed,
    ]);
  });

  it("rejects a document that does not check, and refuses before any app compiled", async () => {
    compileWith();
    await expect(runDocument({ key: "ai.empty", steps: [] }, {})).rejects.toBeInstanceOf(
      AutomationInvalidError,
    );
    CURRENT_WORKFLOWS.value = undefined;
    await expect(runDocument(PLAN, {})).rejects.toThrow(/No testing app/);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `@Step`: it records each step's options for the engine to read with `Step.members`, a
 *          subclass inheriting its ancestor's; it refuses a class that is not a workflow at class definition; it is
 *          registered as a method decorator for workflows.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 6 and 18).
 */
import { DecoratorTarget } from "@stackra/container";
import { Backoff } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Signal } from "#core/bases/signal.base";
import { Workflow } from "#core/bases/workflow.base";
import { Step } from "#core/decorators/step.decorator";
import type { Run } from "#core/types/run.type";

class Approved extends Signal {
  by!: string;
}

class ApproveWorkflow extends Workflow<{ readonly id: string }>({ timeout: "1d" }) {
  @Step({ retry: { attempts: 3, backoff: Backoff.Linear } })
  async submit(): Promise<void> {}

  @Step<ApproveWorkflow>({
    waitFor: Approved,
    correlate: (run) => run.input.id,
    timeout: "12h",
  })
  async approve(_run: Run<this>, _ctx: unknown, approved: Approved): Promise<string> {
    return approved.by;
  }
}

class EscalatingWorkflow extends ApproveWorkflow {
  @Step({ after: ["approve"] })
  async escalate(): Promise<void> {}
}

describe("Step", () => {
  it("records each step's options", () => {
    const steps = Step.members(ApproveWorkflow);
    expect(steps.get("submit")).toEqual({ retry: { attempts: 3, backoff: Backoff.Linear } });
    expect(steps.get("approve")?.waitFor).toBe(Approved);
    expect(steps.get("approve")?.timeout).toBe("12h");
  });

  it("lets a subclass inherit its ancestor's steps", () => {
    expect([...Step.members(EscalatingWorkflow).keys()]).toEqual(["submit", "approve", "escalate"]);
  });

  it("refuses a class that is not a workflow", () => {
    expect(() => {
      class NotAWorkflow {
        async run(): Promise<void> {}
      }
      Step({})(NotAWorkflow.prototype, "run" as never, {});
    }).toThrow(TypeError);
  });

  it("fits a step only, so it does not compile on output", () => {
    class OutputWorkflow extends Workflow({}) {
      // @ts-expect-error -- `output` builds the result; it is not a step
      @Step
      output(): number {
        return 1;
      }
    }
    expect(new OutputWorkflow().output()).toBe(1);
  });

  it("is a method decorator for workflows", () => {
    expect(Step.kind).toBe("step");
    expect(Step.target).toBe(DecoratorTarget.Method);
    expect(Step.kinds).toEqual(["workflow"]);
  });
});

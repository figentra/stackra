/**
 * Stackra file contract:
 * Purpose: unit tests of `planOf`: steps are every method but `output` and the undos, ancestors' first in declaration
 *          order, moved only by `after`; each undo is matched to its step; options are checked and durations read in
 *          milliseconds; it refuses a class that is not a workflow, an undo naming no step, an `after` naming no other
 *          step or forming a cycle, a retry budget below one and a `waitFor` that is neither a signal nor an event; it
 *          caches the plan, and plans the version (1 by default) and a wait on an event.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 18); ADR 0151 (0294 note).
 */
import { Backoff } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import { Signal } from "#core/bases/signal.base";
import { Workflow } from "#core/bases/workflow.base";
import { Step } from "#core/decorators/step.decorator";
import { planOf } from "#core/functions/plan-of.function";

class Collected extends Signal {}

class FulfilWorkflow extends Workflow<{ readonly orderId: string }>({ timeout: "7d" }) {
  async allocate(): Promise<void> {}

  async undoAllocate(): Promise<void> {}

  @Step({
    after: ["notify"],
    retry: { attempts: 5, backoff: Backoff.Fixed },
    heartbeat: "30s",
  })
  async buyLabels(): Promise<void> {}

  async notify(): Promise<void> {}

  @Step({
    waitFor: Collected,
    timeout: "72h",
  })
  async awaitPickup(): Promise<void> {}

  output(): string {
    return "done";
  }
}

class ExpressWorkflow extends FulfilWorkflow {
  async upgrade(): Promise<void> {}
}

describe(planOf, () => {
  it("plans the steps in declaration order, moved only by after", () => {
    const plan = planOf(FulfilWorkflow);
    expect(plan.steps.map((step) => step.name)).toEqual([
      "allocate",
      "notify",
      "buyLabels",
      "awaitPickup",
    ]);
    expect(plan.timeout).toBe(7 * 24 * 3_600_000);
  });

  it("matches undos to steps and reads options", () => {
    const [allocate, , buyLabels, awaitPickup] = planOf(FulfilWorkflow).steps;
    expect(allocate?.undo).toBe("undoAllocate");
    expect(buyLabels).toMatchObject({ attempts: 5, backoff: Backoff.Fixed, heartbeat: 30_000 });
    expect(awaitPickup).toMatchObject({
      waitFor: Collected,
      signal: "Collected",
      timeout: 72 * 3_600_000,
    });
    expect(allocate).toMatchObject({ attempts: 1, backoff: Backoff.Exponential, after: [] });
  });

  it("puts inherited steps first and caches the plan", () => {
    expect(
      planOf(ExpressWorkflow)
        .steps.map((step) => step.name)
        .at(-1),
    ).toBe("upgrade");
    expect(planOf(ExpressWorkflow)).toBe(planOf(ExpressWorkflow));
  });

  it("refuses a class that is not a workflow", () => {
    class Plain {}
    expect(() => planOf(Plain)).toThrow(TypeError);
  });

  it("refuses an undo that names no step", () => {
    class OrphanUndoWorkflow extends Workflow({}) {
      async undoShip(): Promise<void> {}
    }
    expect(() => planOf(OrphanUndoWorkflow)).toThrow(/undoes no step/);
  });

  it("refuses an after that names no other step, or a cycle", () => {
    class MissingAfterWorkflow extends Workflow({}) {
      @Step({ after: ["nowhere"] })
      async ship(): Promise<void> {}
    }
    class CycleWorkflow extends Workflow({}) {
      @Step({ after: ["second"] })
      async first(): Promise<void> {}

      @Step({ after: ["first"] })
      async second(): Promise<void> {}
    }
    expect(() => planOf(MissingAfterWorkflow)).toThrow(TypeError);
    expect(() => planOf(CycleWorkflow)).toThrow(/cycle/);
  });

  it("refuses a retry budget below one and a waitFor that is not a signal", () => {
    class NoAttemptsWorkflow extends Workflow({}) {
      @Step({ retry: { attempts: 0 } })
      async ship(): Promise<void> {}
    }
    class NotASignal {}
    class BadWaitWorkflow extends Workflow({}) {
      @Step({ waitFor: NotASignal as never })
      async ship(): Promise<void> {}
    }
    expect(() => planOf(NoAttemptsWorkflow)).toThrow(RangeError);
    expect(() => planOf(BadWaitWorkflow)).toThrow(TypeError);
  });
});

describe("planOf versions and event waits", () => {
  class OrderCollected extends DomainEvent {
    orderId!: string;
  }

  class PickupWorkflow extends Workflow({ version: 3 }) {
    @Step({
      waitFor: OrderCollected,
      correlate: () => "ord_1",
      timeout: "1h",
    })
    async collected(): Promise<void> {}
  }

  it("plans the version, 1 by default, and a wait on an event", () => {
    expect(planOf(FulfilWorkflow).version).toBe(1);
    const plan = planOf(PickupWorkflow);
    expect(plan.version).toBe(3);
    expect(plan.steps[0]).toMatchObject({ waitFor: OrderCollected, signal: "OrderCollected" });
  });
});

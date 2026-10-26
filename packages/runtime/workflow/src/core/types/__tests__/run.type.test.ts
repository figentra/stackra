/**
 * Stackra file contract:
 * Purpose: type tests of `Run<W>`, `StepName<W>` and `ResultsOf<W>`: the step names leave out `output`, the undos,
 *          private members and fields; results are each step's resolved type, inherited steps included; `Run<this>`
 *          resolves inside a class.
 * Boundary: test only; compile-time assertions with one runtime check that the file loads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 18); the STA-335 spike (`Run<this>`).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Workflow } from "#core/bases/workflow.base";
import type { ResultsOf } from "#core/types/results-of.type";
import type { Run } from "#core/types/run.type";
import type { StepName } from "#core/types/step-name.type";

class ShipWorkflow extends Workflow<{ readonly orderId: string }>({}) {
  readonly label = "ship";

  async allocate(run: Run<this>): Promise<readonly string[]> {
    return [run.input.orderId];
  }

  async undoAllocate(): Promise<void> {}

  async buyLabels(run: Run<this>): Promise<number> {
    return run.results.allocate.length;
  }

  output(run: Run<this>): number {
    void this.helper;
    return run.results.buyLabels;
  }

  private async helper(): Promise<void> {}
}

class ExpressWorkflow extends ShipWorkflow {
  async upgrade(run: Run<this>): Promise<boolean> {
    return run.results.buyLabels > 0;
  }
}

describe("Run, StepName and ResultsOf", () => {
  it("names the steps only", () => {
    expectTypeOf<StepName<ShipWorkflow>>().toEqualTypeOf<"allocate" | "buyLabels">();
    expectTypeOf<StepName<ExpressWorkflow>>().toEqualTypeOf<"allocate" | "buyLabels" | "upgrade">();
  });

  it("types each step's result, inherited steps included", () => {
    expectTypeOf<ResultsOf<ShipWorkflow>["allocate"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<Run<ExpressWorkflow>["results"]["buyLabels"]>().toEqualTypeOf<number>();
    expectTypeOf<Run<ShipWorkflow>["input"]>().toEqualTypeOf<{ readonly orderId: string }>();
  });

  it("leaves fields out of the steps", () => {
    expectTypeOf<"label" extends StepName<ShipWorkflow> ? true : false>().toEqualTypeOf<false>();
    expect(new ShipWorkflow().label).toBe("ship");
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `Workflow`: the called form records its options in the kind registry and makes a fresh base
 *          per call; it refuses a bad timeout, a `startOn` that is not a class and a `correlate` without `startOn`; the
 *          input type flows from `Workflow<I>` and from `startOn` into `Run<this>`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 3, 18 and 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Workflow, WorkflowBase } from "#core/bases/workflow.base";
import type { Run } from "#core/types/run.type";

interface PlaceInput {
  readonly orderId: string;
}

class PaymentCaptured {
  orderId!: string;
}

class PlaceWorkflow extends Workflow<PlaceInput>({ timeout: "2m" }) {
  async price(run: Run<this>): Promise<{ readonly total: number }> {
    return { total: run.input.orderId.length };
  }

  async confirm(run: Run<this>): Promise<number> {
    return run.results.price.total;
  }
}

class FulfilWorkflow extends Workflow({
  startOn: PaymentCaptured,
  correlate: (event) => event.orderId,
}) {
  async allocate(run: Run<this>): Promise<string> {
    return run.input.orderId;
  }
}

describe(Workflow, () => {
  it("records the options of the called form", () => {
    expect(kindOf(PlaceWorkflow)).toEqual({ kind: "workflow", options: { timeout: "2m" } });
    expect(kindOf(FulfilWorkflow)?.options["startOn"]).toBe(PaymentCaptured);
    expect(Object.getPrototypeOf(PlaceWorkflow)).not.toBe(Object.getPrototypeOf(FulfilWorkflow));
  });

  it("makes instances of the workflow base", () => {
    expect(new PlaceWorkflow()).toBeInstanceOf(WorkflowBase);
  });

  it("refuses a timeout that is not a duration", () => {
    expect(() => Workflow({ timeout: "soon" })).toThrow(RangeError);
  });

  it("refuses a startOn that is not a class and a correlate without startOn", () => {
    expect(() => Workflow({ startOn: "PaymentCaptured" as never })).toThrow(TypeError);
    expect(() => Workflow<PlaceInput>({ correlate: (input) => input.orderId })).toThrow(TypeError);
  });

  it("types the input from Workflow<I> and from startOn", () => {
    expectTypeOf<Run<PlaceWorkflow>["input"]>().toEqualTypeOf<PlaceInput>();
    expectTypeOf<Run<FulfilWorkflow>["input"]>().toEqualTypeOf<PaymentCaptured>();
    expectTypeOf<Run<PlaceWorkflow>["results"]["price"]>().toEqualTypeOf<{
      readonly total: number;
    }>();
  });
});

describe("Workflow versions", () => {
  it("records a version and refuses one that is not a whole number from 1", () => {
    class PlaceV2Workflow extends Workflow<PlaceInput>({ timeout: "2m", version: 2 }) {}
    expect(kindOf(PlaceV2Workflow)?.options["version"]).toBe(2);
    expect(() => Workflow({ version: 0 })).toThrow(RangeError);
    expect(() => Workflow({ version: 1.5 })).toThrow(RangeError);
  });
});

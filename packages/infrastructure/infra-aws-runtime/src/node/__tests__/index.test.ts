/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `awsRuntime` and `readRuntimePlan` are its only values, none
 *          of them shared with `.`, and the option and result types resolve with the shapes a generated program uses.
 * Boundary: test only; imports the stand-in barrels through their aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { RunwayEnvironment } from "@stackra/runway";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { RuntimePlan } from "#core/index";
import * as node from "#node/index";
import type { AwsRuntime, AwsRuntimeOptions } from "#node/index";

describe("@stackra/infra-aws-runtime/node", () => {
  it("exports exactly its values, none of them also exported by .", () => {
    expect(Object.keys(node).sort()).toEqual(["awsRuntime", "readRuntimePlan"]);
    for (const name of Object.keys(node)) expect(Object.keys(core)).not.toContain(name);
  });

  it("types the program calls", () => {
    expectTypeOf(node.readRuntimePlan).parameters.toEqualTypeOf<
      [directory: string, environment: RunwayEnvironment]
    >();
    expectTypeOf(node.readRuntimePlan).returns.toEqualTypeOf<RuntimePlan>();
    expectTypeOf(node.awsRuntime).parameters.toEqualTypeOf<
      [plan: RuntimePlan, options: AwsRuntimeOptions]
    >();
    expectTypeOf(node.awsRuntime).returns.toEqualTypeOf<AwsRuntime>();
  });
});

/**
 * Stackra file contract:
 * Purpose: type tests of `LaunchGate`: a ready flag and three lists of names.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { LaunchGate } from "#core/types/launch-gate.type";

describe("LaunchGate", () => {
  it("has a flag and three lists", () => {
    expectTypeOf<LaunchGate["ready"]>().toEqualTypeOf<boolean>();
    expectTypeOf<LaunchGate["notLive"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<LaunchGate["pending"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<LaunchGate["unreviewed"]>().toEqualTypeOf<readonly string[]>();
  });
});

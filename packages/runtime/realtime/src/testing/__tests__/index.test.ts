/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the template's tests import `fakeRealtime` from it, nothing
 *          else is a value, and the `RealtimeFake` type it returns resolves.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RealtimeConnection } from "#core/index";
import * as testing from "#testing/index";
import type { RealtimeFake } from "#testing/index";

describe("@stackra/realtime/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["fakeRealtime"]);
  });

  it("resolves its public type", () => {
    expectTypeOf(testing.fakeRealtime).returns.toEqualTypeOf<RealtimeFake>();
    expectTypeOf<RealtimeFake>().toExtend<RealtimeConnection>();
  });
});

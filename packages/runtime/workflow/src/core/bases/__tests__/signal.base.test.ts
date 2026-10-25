/**
 * Stackra file contract:
 * Purpose: unit tests of `Signal`: a bare kind base, so a subclass is of kind `signal` with no options and an instance
 *          of `Signal`; it has no called form.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 3 and 16: `extends Signal`, no options).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Signal } from "#core/bases/signal.base";

class RedemptionConfirmed extends Signal {
  memberId!: string;

  reference!: string;
}

describe(Signal, () => {
  it("makes a subclass a signal with no options", () => {
    expect(kindOf(RedemptionConfirmed)).toEqual({ kind: "signal", options: {} });
    expect(new RedemptionConfirmed()).toBeInstanceOf(Signal);
  });

  it("has no called form", () => {
    expectTypeOf(Signal).not.toBeCallableWith({});
  });
});

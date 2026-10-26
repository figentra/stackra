/**
 * Stackra file contract:
 * Purpose: unit tests of `assertPayInputs`: a well-formed batch passes; a bad period, an empty batch, a missing
 *          employee or pay code, and a quantity or amount on the wrong kind or not positive are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0422 (decision 5).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PayInputKind } from "#contracts/enums/pay-input-kind.enum";
import type { PayInput } from "#contracts/types/pay-input.type";
import { assertPayInputs } from "#core/functions/assert-pay-inputs.function";

const HOURS: PayInput = { employee: "e1", kind: PayInputKind.Hours, payCode: "OT1", quantity: 7.5 };
const TIPS: PayInput = {
  employee: "e1",
  kind: PayInputKind.Tips,
  payCode: "TIP",
  amount: Money.ofMinor(1250, "SAR"),
};
const batch = (inputs: readonly PayInput[], from = "2026-10-01", to = "2026-10-31") => ({
  from,
  to,
  reference: "run_1",
  inputs,
});

describe(assertPayInputs, () => {
  it("passes a well-formed batch", () => {
    expect(() => assertPayInputs(batch([HOURS, TIPS]))).not.toThrow();
  });

  it("refuses a bad period or an empty batch", () => {
    expect(() => assertPayInputs(batch([HOURS], "2026-10-31", "2026-10-01"))).toThrow(TypeError);
    expect(() => assertPayInputs(batch([HOURS], "2026-02-30", "2026-03-01"))).toThrow(TypeError);
    expect(() => assertPayInputs(batch([]))).toThrow(/at least one input/);
  });

  it("refuses an input of the wrong shape", () => {
    for (const input of [
      { ...HOURS, employee: "" },
      { ...HOURS, payCode: "" },
      { ...HOURS, quantity: 0 },
      { ...HOURS, amount: Money.ofMinor(1, "SAR") },
      { ...TIPS, amount: Money.ofMinor(0, "SAR") },
      { ...TIPS, quantity: 2 },
    ])
      expect(() => assertPayInputs(batch([HOURS, input]))).toThrow(/Pay input 1/);
  });
});

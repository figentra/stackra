/**
 * Stackra file contract:
 * Purpose: type tests of `RefusalClass`: `Refusal({ kind })` returns it, every refusal class fits it, it is abstract,
 *          and its statics return the subclass (`create`) and an `ErrorEnvelope` (`envelope`).
 * Boundary: test only; types are checked by `expectTypeOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 25).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";
import type { ErrorEnvelope } from "#core/types/error-envelope.type";
import type { RefusalClass } from "#core/types/refusal-class.type";

class AccountFrozenError extends Refusal({ kind: ErrorKind.Conflict, retryable: false }) {
  accountId!: string;
}

describe("RefusalClass", () => {
  it("is what Refusal({ kind }) returns, and every refusal class fits it", () => {
    expectTypeOf(Refusal({ kind: ErrorKind.Conflict })).toEqualTypeOf<RefusalClass>();
    const classes: RefusalClass[] = [AccountFrozenError];
    expect(classes).toHaveLength(1);
  });

  it("is abstract, so a refusal is declared before it is built", () => {
    const Base = Refusal({ kind: ErrorKind.Conflict });
    // @ts-expect-error -- the kind base itself is abstract
    const direct = () => new Base();
    expect(direct).toBeTypeOf("function");
  });

  it("returns the subclass from create and an envelope from envelope", () => {
    expectTypeOf(
      AccountFrozenError.create({ accountId: "lac_1" }),
    ).toEqualTypeOf<AccountFrozenError>();
    expectTypeOf(
      AccountFrozenError.envelope({ accountId: "lac_1" }),
    ).toEqualTypeOf<ErrorEnvelope>();
  });
});

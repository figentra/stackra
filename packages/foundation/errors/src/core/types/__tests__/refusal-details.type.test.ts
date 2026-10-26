/**
 * Stackra file contract:
 * Purpose: type tests of `RefusalDetails`: a refusal's declared fields keep their optional modifiers, and the members
 *          every refusal shares (`kind`, `code`, `message`, `toEnvelope`, ...) and methods are left out.
 * Boundary: test only; types are checked by `expectTypeOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";
import type { RefusalDetails } from "#core/types/refusal-details.type";

class InsufficientStockError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {
  variantId!: string;

  available!: number;

  note?: string;

  /** A method is never a detail. */
  describeShortfall(): string {
    return `${this.available} left of ${this.variantId}`;
  }
}

class SessionRequiredError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {}

describe("RefusalDetails", () => {
  it("is the declared fields with their modifiers, without methods", () => {
    expectTypeOf<RefusalDetails<InsufficientStockError>>().toEqualTypeOf<{
      variantId: string;
      available: number;
      note?: string;
    }>();
  });

  it("is empty for a refusal without fields", () => {
    expectTypeOf<keyof RefusalDetails<SessionRequiredError>>().toEqualTypeOf<never>();
  });
});

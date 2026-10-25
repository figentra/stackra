/**
 * Stackra file contract:
 * Purpose: type tests of `ErrorEnvelope`, `FieldErrors` and `RefusalOptions`: the envelope requires `code`,
 *          `category` and `retryable` and takes the rest as optional; field errors map paths to codes; the options
 *          require a kind.
 * Boundary: test only; types are checked by `expectTypeOf` and `@ts-expect-error`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140 (decision 1).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import type { ErrorEnvelope } from "#core/types/error-envelope.type";
import type { FieldErrors } from "#core/types/field-errors.type";
import type { RefusalOptions } from "#core/types/refusal-options.type";

describe("ErrorEnvelope", () => {
  it("requires code, category and retryable, and takes the rest as optional", () => {
    const minimal: ErrorEnvelope = {
      code: "orders_paused",
      category: "precondition_failed",
      retryable: false,
    };
    const full: ErrorEnvelope = {
      ...minimal,
      details: { orderId: "ord_1" },
      fieldErrors: { "lines.0.variantId": "insufficient_stock" },
      correlationId: "trc_1",
      action: "orders.order.create@1",
    };
    const wrong: ErrorEnvelope = {
      code: "x",
      // @ts-expect-error -- a category outside the ten
      category: "failed_precondition",
      retryable: false,
    };
    expect([minimal, full, wrong]).toHaveLength(3);
    expectTypeOf<ErrorEnvelope["fieldErrors"]>().toEqualTypeOf<FieldErrors | undefined>();
  });
});

describe("FieldErrors", () => {
  it("maps a wire path to a code", () => {
    expectTypeOf<FieldErrors>().toEqualTypeOf<Readonly<Record<string, string>>>();
  });
});

describe("RefusalOptions", () => {
  it("requires a kind and takes retryable as optional", () => {
    const options: RefusalOptions = { kind: ErrorKind.NotFound };
    // @ts-expect-error -- the kind is required
    const noKind: RefusalOptions = { retryable: true };
    expect([options, noKind]).toHaveLength(2);
  });
});

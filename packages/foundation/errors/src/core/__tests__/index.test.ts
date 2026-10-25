/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/errors`
 *          (`CoreRefusals`, `ErrorKind`, `ForbiddenError`, `Refusal`, `WorkflowTimedOutError`, `isRefusal`) and the
 *          registry row's core refusals and code derivation are exported, nothing else is, `ErrorReporter` is not
 *          (it is exported from `./contracts` only), and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as errors from "#core/index";
import type {
  ErrorCategory,
  ErrorEnvelope,
  FieldErrors,
  RefusalClass,
  RefusalDetails,
  RefusalOptions,
} from "#core/index";

describe("@stackra/errors", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(errors).sort()).toEqual([
      "BridgeRejectedError",
      "CoreRefusals",
      "EntitlementRequiredError",
      "ErrorKind",
      "ForbiddenError",
      "IdempotencyKeyReusedError",
      "LiveReadOnlyError",
      "NotFoundError",
      "RateLimitedError",
      "Refusal",
      "SentryConfig",
      "SentryConfig$",
      "SentryErrorReporterDriver",
      "SentryOptions",
      "UnauthenticatedError",
      "WorkflowTimedOutError",
      "isRefusal",
      "refusalCode",
    ]);
    expect("ErrorReporter" in errors).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<ErrorEnvelope["category"]>().toEqualTypeOf<ErrorCategory>();
    expectTypeOf<FieldErrors>().toBeObject();
    expectTypeOf<RefusalOptions["kind"]>().toEqualTypeOf<errors.ErrorKind>();
    expectTypeOf<RefusalDetails<errors.ForbiddenError>>().toBeObject();
    expectTypeOf(
      errors.Refusal({ kind: errors.ErrorKind.Forbidden }),
    ).toEqualTypeOf<RefusalClass>();
  });
});

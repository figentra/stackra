/**
 * Stackra file contract:
 * Purpose: unit tests of `EntitlementRequiredError`: a refusal of kind `EntitlementRequired` with code `entitlement_required`, category `entitlement_required` (HTTP 402),
 *          not retryable, carrying no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { EntitlementRequiredError } from "#core/errors/entitlement-required.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("EntitlementRequiredError", () => {
  it("is a EntitlementRequired refusal with code entitlement_required", () => {
    const refused = EntitlementRequiredError.create();
    expect(isRefusal(refused, EntitlementRequiredError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.EntitlementRequired);
    expect(refused.code).toBe("entitlement_required");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(402);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(EntitlementRequiredError.envelope()).toEqual({
      code: "entitlement_required",
      category: "entitlement_required",
      retryable: false,
    });
  });
});

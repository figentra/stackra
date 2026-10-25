/**
 * Stackra file contract:
 * Purpose: unit tests of `ConditionInvalidError`: a Validation refusal with code condition_invalid whose envelope
 *          carries the refused paths as field errors and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0331 (decision 10).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConditionInvalidError } from "#core/errors/condition-invalid.error";

describe("ConditionInvalidError", () => {
  it("is a Validation refusal with code condition_invalid", () => {
    const refused = ConditionInvalidError.create();
    expect(isRefusal(refused, ConditionInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("condition_invalid");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("carries the refused paths as field errors", () => {
    const fieldErrors = { "all.0": "field_unknown", "(root)": "too_many_nodes" };
    expect(ConditionInvalidError.create({}, { fieldErrors }).toEnvelope()).toEqual({
      code: "condition_invalid",
      category: "validation",
      retryable: false,
      fieldErrors,
    });
  });
});

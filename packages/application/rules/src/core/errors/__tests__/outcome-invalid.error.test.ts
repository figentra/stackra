/**
 * Stackra file contract:
 * Purpose: unit tests of `OutcomeInvalidError`: a 400 Validation refusal, code `outcome_invalid`, that carries the
 *          refused outcome paths as field errors.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0331 (decisions 9 and 10).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { OutcomeInvalidError } from "#core/errors/outcome-invalid.error";

describe("OutcomeInvalidError", () => {
  it("is a Validation refusal with code outcome_invalid", () => {
    const refused = OutcomeInvalidError.create();
    expect(isRefusal(refused, OutcomeInvalidError)).toBe(true);
    expect(refused.code).toBe("outcome_invalid");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("carries the refused paths as field errors", () => {
    const fieldErrors = { "0.params.days": "value_invalid", "1": "kind_unknown" };
    expect(OutcomeInvalidError.create({}, { fieldErrors }).toEnvelope()).toMatchObject({
      code: "outcome_invalid",
      fieldErrors,
    });
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `FormInvalidError`: a refusal of kind `Validation` with code `form_invalid` (HTTP 400), not
 *          retryable, carrying field errors by path and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0426 (decisions 1 and 2).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FormInvalidError } from "#core/errors/form-invalid.error";

describe("FormInvalidError", () => {
  it("is a Validation refusal with code form_invalid and field errors", () => {
    const refused = FormInvalidError.create(
      {},
      { fieldErrors: { "steps.1.when.(root)": "field_unknown" } },
    );
    expect(isRefusal(refused, FormInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("form_invalid");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
    expect(refused.fieldErrors).toEqual({ "steps.1.when.(root)": "field_unknown" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });
});

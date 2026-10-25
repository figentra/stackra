/**
 * Stackra file contract:
 * Purpose: unit tests of `CustomFieldsInvalidError`: a `Validation` refusal with code `custom_fields_invalid` (HTTP
 *          400), not retryable, with no details and its field errors in the envelope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CustomFieldsInvalidError } from "#core/errors/custom-fields-invalid.error";

describe("CustomFieldsInvalidError", () => {
  it("is a Validation refusal with code custom_fields_invalid", () => {
    const refused = CustomFieldsInvalidError.create();
    expect(isRefusal(refused, CustomFieldsInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("custom_fields_invalid");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("carries its field errors and no details in the envelope", () => {
    const refused = CustomFieldsInvalidError.create(
      {},
      { fieldErrors: { shoeSize: "invalid_value" } },
    );
    expect(refused.toEnvelope()).toEqual({
      code: "custom_fields_invalid",
      category: "validation",
      retryable: false,
      fieldErrors: { shoeSize: "invalid_value" },
    });
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `CustomFieldDefinitionInvalidError`: a `Validation` refusal with code
 *          `custom_field_definition_invalid` (HTTP 400), not retryable, with no details and its field errors in the
 *          envelope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CustomFieldDefinitionInvalidError } from "#core/errors/custom-field-definition-invalid.error";

describe("CustomFieldDefinitionInvalidError", () => {
  it("is a Validation refusal with code custom_field_definition_invalid", () => {
    const refused = CustomFieldDefinitionInvalidError.create();
    expect(isRefusal(refused, CustomFieldDefinitionInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("custom_field_definition_invalid");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("carries its field errors and no details in the envelope", () => {
    const refused = CustomFieldDefinitionInvalidError.create(
      {},
      { fieldErrors: { choices: "choices_required" } },
    );
    expect(refused.toEnvelope()).toEqual({
      code: "custom_field_definition_invalid",
      category: "validation",
      retryable: false,
      fieldErrors: { choices: "choices_required" },
    });
  });
});

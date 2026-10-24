/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CustomFieldTakenError`: a `Conflict` refusal with code `custom_field_taken` (HTTP
 *          409), not retryable, whose typed `create` takes the model key and the field key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CustomFieldTakenError } from "#core/errors/custom-field-taken.error";

describe("CustomFieldTakenError", () => {
  it("is a Conflict refusal with code custom_field_taken", () => {
    const refused = CustomFieldTakenError.create({ model: "catalogue.product", key: "shoeSize" });
    expect(isRefusal(refused, CustomFieldTakenError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Conflict);
    expect(refused.code).toBe("custom_field_taken");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(409);
  });

  it("carries the model and the key in its envelope", () => {
    expect(CustomFieldTakenError.envelope({ model: "catalogue.product", key: "shoeSize" })).toEqual(
      {
        code: "custom_field_taken",
        category: "conflict",
        retryable: false,
        details: { model: "catalogue.product", key: "shoeSize" },
      },
    );
  });

  it("requires its details", () => {
    // @ts-expect-error -- `model` and `key` are required
    expect(CustomFieldTakenError.create().code).toBe("custom_field_taken");
  });
});

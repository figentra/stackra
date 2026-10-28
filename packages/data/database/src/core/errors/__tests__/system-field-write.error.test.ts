/**
 * Stackra file contract:
 * Purpose: unit tests of `SystemFieldWriteError` and `ModelInvalidError`: both are `validation` refusals, coded
 *          `system_field_write` and `model_invalid`, naming the model and the field or the issues, never a value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: data-layer gap mo21 (stackra-287); ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ModelInvalidError } from "#core/errors/model-invalid.error";
import { SystemFieldWriteError } from "#core/errors/system-field-write.error";

describe("SystemFieldWriteError", () => {
  it("is a validation refusal naming the model, the field and the write", () => {
    const error = SystemFieldWriteError.create({
      model: "Order",
      field: "createdBy",
      operation: "update",
    });
    expect(isRefusal(error, SystemFieldWriteError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Validation);
    expect(error.toEnvelope()).toMatchObject({
      code: "system_field_write",
      details: { model: "Order", field: "createdBy", operation: "update" },
    });
  });
});

describe("ModelInvalidError", () => {
  it("is a validation refusal listing the issues", () => {
    const error = ModelInvalidError.create({ model: "PriceRule", issues: ["rate: too_big"] });
    expect(isRefusal(error, ModelInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Validation);
    expect(error.toEnvelope()).toMatchObject({
      code: "model_invalid",
      details: { model: "PriceRule", issues: ["rate: too_big"] },
    });
  });
});

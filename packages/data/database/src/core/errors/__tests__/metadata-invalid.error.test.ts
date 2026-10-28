/**
 * Stackra file contract:
 * Purpose: unit tests of `MetadataInvalidError`: a validation refusal with the code `metadata_invalid` that names the
 *          model and the reason.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0321 (decision 4); ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MetadataInvalidError } from "#core/errors/metadata-invalid.error";

describe("MetadataInvalidError", () => {
  it("is a validation refusal naming the model and the reason", () => {
    const error = MetadataInvalidError.create({ model: "Customer", reason: "too_large" });
    expect(isRefusal(error, MetadataInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Validation);
    expect(error.toEnvelope()).toMatchObject({
      code: "metadata_invalid",
      details: { model: "Customer", reason: "too_large" },
    });
  });
});

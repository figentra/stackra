/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ScopeLabelInvalidError`: a refusal of kind `Validation` with code
 *          `scope_label_invalid` (HTTP 400), not retryable, whose typed `create` takes the label.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScopeLabelInvalidError } from "#core/errors/scope-label-invalid.error";

describe("ScopeLabelInvalidError", () => {
  it("is a Validation refusal with code scope_label_invalid", () => {
    const refused = ScopeLabelInvalidError.create({ label: "Acme EU" });
    expect(isRefusal(refused, ScopeLabelInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("scope_label_invalid");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({ label: "Acme EU" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("requires its label", () => {
    // @ts-expect-error -- `label` is required
    expect(ScopeLabelInvalidError.create().code).toBe("scope_label_invalid");
  });
});

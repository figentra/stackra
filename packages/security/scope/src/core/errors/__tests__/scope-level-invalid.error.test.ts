/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ScopeLevelInvalidError`: a refusal of kind `Validation` with code
 *          `scope_level_invalid` (HTTP 400), not retryable, whose typed `create` takes the level and the allowed levels.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScopeLevelInvalidError } from "#core/errors/scope-level-invalid.error";

describe("ScopeLevelInvalidError", () => {
  it("is a Validation refusal with code scope_level_invalid", () => {
    const refused = ScopeLevelInvalidError.create({ level: "platform", allowed: ["product"] });
    expect(isRefusal(refused, ScopeLevelInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("scope_level_invalid");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("carries the level and the allowed levels in its envelope", () => {
    expect(ScopeLevelInvalidError.envelope({ level: "platform", allowed: ["product"] })).toEqual({
      code: "scope_level_invalid",
      category: "validation",
      retryable: false,
      details: { level: "platform", allowed: ["product"] },
    });
  });

  it("requires its details", () => {
    // @ts-expect-error -- `level` and `allowed` are required
    expect(ScopeLevelInvalidError.create().code).toBe("scope_level_invalid");
  });
});

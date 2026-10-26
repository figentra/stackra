/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ScopeMoveInvalidError`: a refusal of kind `Validation` with code
 *          `scope_move_invalid` (HTTP 400), not retryable, whose typed `create` takes the node's and the parent's path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0411; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScopeMoveInvalidError } from "#core/errors/scope-move-invalid.error";

describe("ScopeMoveInvalidError", () => {
  it("is a Validation refusal with code scope_move_invalid", () => {
    const refused = ScopeMoveInvalidError.create({ path: "platform.a", parent: "platform.a.b" });
    expect(isRefusal(refused, ScopeMoveInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("scope_move_invalid");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("carries both paths in its envelope", () => {
    expect(ScopeMoveInvalidError.envelope({ path: "platform.a", parent: "platform.a.b" })).toEqual({
      code: "scope_move_invalid",
      category: "validation",
      retryable: false,
      details: { path: "platform.a", parent: "platform.a.b" },
    });
  });

  it("requires its details", () => {
    // @ts-expect-error -- `path` and `parent` are required
    expect(ScopeMoveInvalidError.create().code).toBe("scope_move_invalid");
  });
});

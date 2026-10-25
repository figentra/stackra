/**
 * Stackra file contract:
 * Purpose: unit and type tests of `BlockNotRegisteredError`: a refusal of kind `Validation` with code
 *          `block_not_registered` (HTTP 400), not retryable, whose typed `create` takes the block key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { BlockNotRegisteredError } from "#core/errors/block-not-registered.error";

describe("BlockNotRegisteredError", () => {
  it("is a Validation refusal with code block_not_registered", () => {
    const refused = BlockNotRegisteredError.create({ block: "web.hero_section" });
    expect(isRefusal(refused, BlockNotRegisteredError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("block_not_registered");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({ block: "web.hero_section" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("requires its block", () => {
    // @ts-expect-error -- `block` is required
    expect(BlockNotRegisteredError.create().code).toBe("block_not_registered");
  });
});

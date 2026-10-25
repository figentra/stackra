/**
 * Stackra file contract:
 * Purpose: unit and type tests of `BlockNotAllowedError`: a refusal of kind `Validation` with code `block_not_allowed`
 *          (HTTP 400), not retryable, whose typed `create` takes the block key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { BlockNotAllowedError } from "#core/errors/block-not-allowed.error";

describe("BlockNotAllowedError", () => {
  it("is a Validation refusal with code block_not_allowed", () => {
    const refused = BlockNotAllowedError.create({ block: "web.hero_section" });
    expect(isRefusal(refused, BlockNotAllowedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("block_not_allowed");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({ block: "web.hero_section" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("requires its block", () => {
    // @ts-expect-error -- `block` is required
    expect(BlockNotAllowedError.create().code).toBe("block_not_allowed");
  });
});

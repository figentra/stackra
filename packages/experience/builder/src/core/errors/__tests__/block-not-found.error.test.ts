/**
 * Stackra file contract:
 * Purpose: unit and type tests of `BlockNotFoundError`: a refusal of kind `NotFound` with code `block_not_found`
 *          (HTTP 404), not retryable, whose typed `create` takes the block id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { BlockNotFoundError } from "#core/errors/block-not-found.error";

describe("BlockNotFoundError", () => {
  it("is a NotFound refusal with code block_not_found", () => {
    const refused = BlockNotFoundError.create({ id: "hero" });
    expect(isRefusal(refused, BlockNotFoundError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.NotFound);
    expect(refused.code).toBe("block_not_found");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({ id: "hero" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(404);
  });

  it("requires its id", () => {
    // @ts-expect-error -- `id` is required
    expect(BlockNotFoundError.create().code).toBe("block_not_found");
  });
});

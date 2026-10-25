/**
 * Stackra file contract:
 * Purpose: unit and type tests of `BlockMoveInvalidError`: a refusal of kind `Validation` with code
 *          `block_move_invalid` (HTTP 400), not retryable, whose typed `create` takes the block and the parent
 *          asked for.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { BlockMoveInvalidError } from "#core/errors/block-move-invalid.error";

describe("BlockMoveInvalidError", () => {
  it("is a Validation refusal with code block_move_invalid", () => {
    const refused = BlockMoveInvalidError.create({ id: "section", parentId: "column" });
    expect(isRefusal(refused, BlockMoveInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("block_move_invalid");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({ id: "section", parentId: "column" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });

  it("requires both ids", () => {
    // @ts-expect-error -- `parentId` is required
    expect(BlockMoveInvalidError.create({ id: "section" }).code).toBe("block_move_invalid");
  });
});

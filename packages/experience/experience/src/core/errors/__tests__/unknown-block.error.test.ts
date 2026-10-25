/**
 * Stackra file contract:
 * Purpose: unit tests of `UnknownBlockError`: a `Validation` refusal with code `unknown_block` (HTTP 400), not
 *          retryable, naming the key and the node's path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decision 6); ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UnknownBlockError } from "#core/errors/unknown-block.error";

describe("UnknownBlockError", () => {
  it("is a Validation refusal with code unknown_block and the key and path as details", () => {
    const refused = UnknownBlockError.create({ block: "web.gone", path: "0.children.1" });
    expect(isRefusal(refused, UnknownBlockError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("unknown_block");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({ block: "web.gone", path: "0.children.1" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });
});

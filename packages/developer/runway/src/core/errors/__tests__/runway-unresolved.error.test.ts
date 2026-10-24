/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayUnresolvedError`: a plain `Error` with its own name and the given message.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";

describe("RunwayUnresolvedError", () => {
  it("carries the message and its name", () => {
    const error = new RunwayUnresolvedError("run `stackra dev` first");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RunwayUnresolvedError");
    expect(error.message).toBe("run `stackra dev` first");
  });
});

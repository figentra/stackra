/**
 * Stackra file contract:
 * Purpose: unit tests of `RenderInputError`: a plain `Error` that names the assistant and the problem.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { RenderInputError } from "#core/errors/render-input.error";

describe("RenderInputError", () => {
  it("names the assistant and the problem", () => {
    const error = new RenderInputError(
      "kiro",
      'subagent "reviewer" names Fly, which KIRO_TOOLS does not map',
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RenderInputError");
    expect(error.assistant).toBe("kiro");
    expect(error.message).toBe(
      'Cannot render for kiro: subagent "reviewer" names Fly, which KIRO_TOOLS does not map',
    );
  });
});

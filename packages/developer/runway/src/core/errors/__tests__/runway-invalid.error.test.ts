/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayInvalidError`: names the source and every issue path in its message, keeps a frozen
 *          copy of the issues, and is a plain `Error` with its own name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";

describe("RunwayInvalidError", () => {
  it("names the source and each path", () => {
    const issues = [
      { path: "requires.cache.reason", message: "A dedicated resource needs a reason" },
      { path: "", message: "Not JSON" },
    ];
    const error = new RunwayInvalidError("services/commerce/runway.yaml", issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("RunwayInvalidError");
    expect(error.source).toBe("services/commerce/runway.yaml");
    expect(error.message).toBe(
      "services/commerce/runway.yaml is invalid: requires.cache.reason: A dedicated resource needs a reason; " +
        "(document): Not JSON",
    );
    expect(error.issues).toEqual(issues);
    expect(Object.isFrozen(error.issues)).toBe(true);

    issues.pop();
    expect(error.issues).toHaveLength(2);
  });
});

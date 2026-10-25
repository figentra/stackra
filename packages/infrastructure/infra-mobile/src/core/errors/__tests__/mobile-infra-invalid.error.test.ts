/**
 * Stackra file contract:
 * Purpose: unit tests of `MobileInfraInvalidError`: names the source and every issue path in its message, keeps a
 *          frozen copy of the issues, and is a plain `Error` with its own name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { MobileInfraInvalidError } from "#core/errors/mobile-infra-invalid.error";

describe("MobileInfraInvalidError", () => {
  it("names the source and each path", () => {
    const issues = [
      { path: "root.providers.expo.projectId", message: "The mobile release needs it" },
      { path: "apple:teamId", message: '"abc" is not a valid apple.teamId' },
    ];
    const error = new MobileInfraInvalidError("the mobile release runways", issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MobileInfraInvalidError");
    expect(error.source).toBe("the mobile release runways");
    expect(error.message).toBe(
      "the mobile release runways is invalid: root.providers.expo.projectId: The mobile release needs it; " +
        'apple:teamId: "abc" is not a valid apple.teamId',
    );
    expect(error.issues).toEqual(issues);
    expect(Object.isFrozen(error.issues)).toBe(true);

    issues.pop();
    expect(error.issues).toHaveLength(2);
  });
});

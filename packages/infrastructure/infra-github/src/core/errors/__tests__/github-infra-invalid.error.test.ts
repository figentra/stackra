/**
 * Stackra file contract:
 * Purpose: unit tests of `GithubInfraInvalidError`: names the source and every issue path in its message (a whole
 *          document reads `(document)`), keeps a frozen copy of the issues, and is a plain `Error` with its own name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { GithubInfraInvalidError } from "#core/errors/github-infra-invalid.error";

describe("GithubInfraInvalidError", () => {
  it("names the source and each path", () => {
    const issues = [
      { path: "root.providers.github.repo", message: "Expected a GitHub repository name" },
      { path: "", message: "Not readable as JSON" },
    ];
    const error = new GithubInfraInvalidError("the root runway", issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("GithubInfraInvalidError");
    expect(error.source).toBe("the root runway");
    expect(error.message).toBe(
      "the root runway is invalid: root.providers.github.repo: Expected a GitHub repository name; " +
        "(document): Not readable as JSON",
    );
    expect(error.issues).toEqual(issues);
    expect(Object.isFrozen(error.issues)).toBe(true);

    issues.pop();
    expect(error.issues).toHaveLength(2);
  });
});

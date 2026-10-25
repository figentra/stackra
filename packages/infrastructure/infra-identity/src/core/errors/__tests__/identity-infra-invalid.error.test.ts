/**
 * Stackra file contract:
 * Purpose: unit tests of `IdentityInfraInvalidError`: names the source and every issue path in its message, keeps a
 *          frozen copy of the issues, and is a plain `Error` with its own name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { IdentityInfraInvalidError } from "#core/errors/identity-infra-invalid.error";

describe("IdentityInfraInvalidError", () => {
  it("names the source and each path", () => {
    const issues = [
      { path: "root.providers.zitadel", message: "The identity stack needs the ZITADEL instances" },
      { path: "seed.apps.console.redirectUris.production.0", message: "Expected an absolute URI" },
    ];
    const error = new IdentityInfraInvalidError("the identity seed and root runway", issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("IdentityInfraInvalidError");
    expect(error.source).toBe("the identity seed and root runway");
    expect(error.message).toBe(
      "the identity seed and root runway is invalid: root.providers.zitadel: The identity stack needs the ZITADEL " +
        "instances; seed.apps.console.redirectUris.production.0: Expected an absolute URI",
    );
    expect(error.issues).toEqual(issues);
    expect(Object.isFrozen(error.issues)).toBe(true);

    issues.pop();
    expect(error.issues).toHaveLength(2);
  });
});

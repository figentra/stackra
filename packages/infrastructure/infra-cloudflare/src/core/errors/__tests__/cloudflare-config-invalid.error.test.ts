/**
 * Stackra file contract:
 * Purpose: unit tests of `CloudflareConfigInvalidError`: names the source and every issue path in its message, keeps a
 *          frozen copy of the issues, and is a plain `Error` with its own name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";

describe("CloudflareConfigInvalidError", () => {
  it("names the source and each path", () => {
    const issues = [
      { path: "edge.bots.mode", message: "Invalid option" },
      { path: "", message: "Not an object" },
    ];
    const error = new CloudflareConfigInvalidError("runway.yaml", issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("CloudflareConfigInvalidError");
    expect(error.source).toBe("runway.yaml");
    expect(error.message).toBe(
      "runway.yaml is invalid: edge.bots.mode: Invalid option; (document): Not an object",
    );
    expect(error.issues).toEqual(issues);
    expect(Object.isFrozen(error.issues)).toBe(true);

    issues.pop();
    expect(error.issues).toHaveLength(2);
  });
});

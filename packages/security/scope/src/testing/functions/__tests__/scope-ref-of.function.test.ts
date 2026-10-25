/**
 * Stackra file contract:
 * Purpose: unit tests of `scopeRefOf`: the same path gives the same id, different paths different ids, the id has the
 *          public-id shape, and a path that is not a scope path is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0135.
 */
import { describe, expect, it } from "@stackra/testing";

import { scopeRefOf } from "#testing/functions/scope-ref-of.function";

describe("scopeRefOf", () => {
  it("derives a stable public-id-shaped id from the path", () => {
    const acme = scopeRefOf("platform.acme");
    expect(acme.path).toBe("platform.acme");
    expect(acme.id).toMatch(/^scp_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(scopeRefOf("platform.acme").id).toBe(acme.id);
    expect(scopeRefOf("platform.globex").id).not.toBe(acme.id);
  });

  it("refuses a path that is not a scope path", () => {
    expect(() => scopeRefOf("platform.*")).toThrow(RangeError);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `scopeIdOf`: a `scp_` public id hashed from the path, stable across calls and different for
 *          different paths.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0135.
 */
import { describe, expect, it } from "@stackra/testing";

import { scopeIdOf } from "#core/functions/scope-id-of.function";

describe("scopeIdOf", () => {
  it("hashes a path into a stable scp_ public id", () => {
    expect(scopeIdOf("platform.acme")).toBe("scp_wrbz8k4c9806dkfqvq5131ab0q");
    expect(scopeIdOf("platform.acme")).toMatch(/^scp_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(scopeIdOf("platform.beta")).not.toBe(scopeIdOf("platform.acme"));
  });
});

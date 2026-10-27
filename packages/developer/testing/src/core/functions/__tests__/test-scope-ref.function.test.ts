/**
 * Stackra file contract:
 * Purpose: unit tests of `testScopeRef`: a labelled tenant's path sits under `platform` (or the given
 *          parent) with the id hashed from it, the same as `scopeRefOf` gives; an unlabelled call is a new tenant each
 *          time; a bad label or parent is a RangeError.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decisions 2 and 3); ADR 0327 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { testScopeRef } from "#core/functions/test-scope-ref.function";

/** A `scp_` public id: the prefix and 26 lowercase Crockford base32 characters. */
const SCOPE_ID = /^scp_[0-9a-hjkmnp-tv-z]{26}$/;

describe("testScopeRef", () => {
  it("puts a labelled tenant under platform with the id scopeRefOf gives its path", () => {
    const acme = testScopeRef("acme");
    expect(acme).toEqual({ id: "scp_wrbz8k4c9806dkfqvq5131ab0q", path: "platform.acme" });
    expect(Object.isFrozen(acme)).toBe(true);
    expect(testScopeRef("acme")).toEqual(acme);
  });

  it("puts a tenant under the given parent", () => {
    expect(testScopeRef("shop", { under: "platform.acme" })).toEqual({
      id: "scp_tm8k4qw4fk2bdcfe0xxtngbeer",
      path: "platform.acme.shop",
    });
  });

  it("hands out a new tenant on each unlabelled call", () => {
    const first = testScopeRef();
    const second = testScopeRef();
    expect(first.path).toMatch(/^platform\.tenant_\d+$/);
    expect(second.path).not.toBe(first.path);
    expect(second.id).not.toBe(first.id);
    expect(first.id).toMatch(SCOPE_ID);
  });

  it.each([
    ["Acme", {}],
    ["acme.eu", {}],
    ["acme", { under: "Platform" }],
    ["acme", { under: "platform..acme" }],
  ])("refuses the label %s under %o", (label, options) => {
    expect(() => testScopeRef(label, options)).toThrow(RangeError);
  });
});

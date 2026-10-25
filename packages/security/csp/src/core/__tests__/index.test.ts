/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/csp`
 *          (`CspConfig`, `contentSecurityPolicy`, `createNonce`, `cspHeaderName`) is exported, nothing else is, and the
 *          public type `CspAdditions` resolves to the shape the generated middleware passes.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as csp from "#core/index";
import type { CspAdditions } from "#core/index";

describe("@stackra/csp", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(csp).sort()).toEqual([
      "CspConfig",
      "contentSecurityPolicy",
      "createNonce",
      "cspHeaderName",
    ]);
  });

  it("keeps the internals out of the entry", () => {
    for (const name of ["CspOptions", "CSP_BASELINE", "cspSource", "CSP_SOURCE_PATTERN"]) {
      expect(name in csp).toBe(false);
    }
  });

  it("types the middleware's additions", () => {
    expectTypeOf<{ connect: string[]; nonce: string }>().toExtend<CspAdditions>();
    expectTypeOf<CspAdditions["nonce"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf(csp.contentSecurityPolicy).returns.toEqualTypeOf<string>();
  });
});

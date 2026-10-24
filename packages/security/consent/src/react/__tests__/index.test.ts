/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the template imports `useConsent` from
 *          `@stackra/consent/react`; it is the only value exported, with its two result types.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { ConsentStatus } from "#core/index";
import * as react from "#react/index";
import type { CategoryConsent, ConsentState } from "#react/index";

describe("@stackra/consent/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual(["useConsent"]);
  });

  it("types what the template's banner and settings page read", () => {
    expectTypeOf<CategoryConsent["status"]>().toEqualTypeOf<ConsentStatus>();
    expectTypeOf<CategoryConsent["isLoaded"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ConsentState["isGranted"]>().returns.toEqualTypeOf<boolean>();
    expectTypeOf<ConsentState["set"]>().parameter(1).toEqualTypeOf<boolean>();
  });
});

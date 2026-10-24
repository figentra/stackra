/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./testing` entry of @stackra/theming: `fakeColorScheme` and its options type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { fakeColorScheme } from "#testing/functions/fake-color-scheme.function";
import * as testing from "#testing/index";
import type { FakeColorSchemeOptions } from "#testing/index";

describe("@stackra/theming/testing", () => {
  it("exports exactly the fake", () => {
    expect(Object.keys(testing)).toEqual(["fakeColorScheme"]);
    expect(testing.fakeColorScheme).toBe(fakeColorScheme);
  });

  it("types its options", () => {
    expectTypeOf<keyof FakeColorSchemeOptions>().toEqualTypeOf<"scheme" | "system" | "config">();
  });
});

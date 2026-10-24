/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./browser` entry: `createApp` (the template's web and console browser
 *          entries import it, in both argument forms) and `hydrateRoute` (its offline entry imports it) are the only
 *          values, and `createApp` resolves to a `BrowserApp`.
 * Boundary: test only; imports the stand-in barrel through its `#browser` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8); ADR 0127 2026-10-24 note.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as browser from "#browser/index";
import type { BrowserApp, HydrateRouteOptions } from "#browser/index";

describe("@stackra/app/browser", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(browser).sort()).toEqual(["createApp", "hydrateRoute"]);
  });

  it("resolves createApp to a BrowserApp and types hydrateRoute's options", () => {
    expectTypeOf(browser.createApp).returns.resolves.toEqualTypeOf<BrowserApp>();
    expectTypeOf(browser.hydrateRoute).parameter(1).toEqualTypeOf<HydrateRouteOptions>();
  });
});

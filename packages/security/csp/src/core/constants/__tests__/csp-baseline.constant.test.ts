/**
 * Stackra file contract:
 * Purpose: unit tests of `CSP_BASELINE`: the fixed directives and their order, no `'unsafe-inline'` or
 *          `'unsafe-eval'` for scripts or `<style>` elements, and no wildcard anywhere.
 * Boundary: test only; a change to the baseline is a security change and must change this test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237; ADR 0251.
 */
import { describe, expect, it } from "@stackra/testing";

import { CSP_BASELINE } from "#core/constants/csp-baseline.constant";

describe("CSP_BASELINE", () => {
  it("lists the directives in header order", () => {
    expect(Object.keys(CSP_BASELINE)).toEqual([
      "default-src",
      "script-src",
      "style-src",
      "style-src-attr",
      "img-src",
      "font-src",
      "connect-src",
      "frame-src",
      "object-src",
      "base-uri",
      "form-action",
      "frame-ancestors",
    ]);
  });

  it("never allows inline or evaluated scripts and style elements", () => {
    for (const directive of ["default-src", "script-src", "style-src"] as const) {
      expect(CSP_BASELINE[directive]).toEqual(["'self'"]);
    }
  });

  it("locks plugins, base, forms and framing", () => {
    expect(CSP_BASELINE["object-src"]).toEqual(["'none'"]);
    expect(CSP_BASELINE["base-uri"]).toEqual(["'none'"]);
    expect(CSP_BASELINE["form-action"]).toEqual(["'self'"]);
    expect(CSP_BASELINE["frame-ancestors"]).toEqual(["'none'"]);
  });

  it("allows no wildcard source", () => {
    for (const sources of Object.values(CSP_BASELINE)) {
      expect(sources.some((source) => source.includes("*"))).toBe(false);
    }
  });
});

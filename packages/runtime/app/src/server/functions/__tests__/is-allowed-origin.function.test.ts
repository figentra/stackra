/**
 * Stackra file contract:
 * Purpose: unit tests of `isAllowedOrigin`: exact match after normalising case and default port; a
 *          different scheme, port or host, the opaque `null` origin and a non-URL never pass.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437.
 */
import { describe, expect, it } from "@stackra/testing";

import { isAllowedOrigin } from "#server/functions/is-allowed-origin.function";

const ALLOWED = ["https://app.acme.example"];

describe("isAllowedOrigin", () => {
  it("passes an exact origin, normalising case and the default port", () => {
    expect(isAllowedOrigin("https://app.acme.example", ALLOWED)).toBe(true);
    expect(isAllowedOrigin("https://APP.acme.example:443", ALLOWED)).toBe(true);
  });

  it("refuses another scheme, port or host", () => {
    expect(isAllowedOrigin("http://app.acme.example", ALLOWED)).toBe(false);
    expect(isAllowedOrigin("https://app.acme.example:8443", ALLOWED)).toBe(false);
    expect(isAllowedOrigin("https://app.acme.example.evil.example", ALLOWED)).toBe(false);
  });

  it("refuses the opaque origin and a non-URL", () => {
    expect(isAllowedOrigin("null", ["null"])).toBe(false);
    expect(isAllowedOrigin("not a url", ALLOWED)).toBe(false);
  });
});

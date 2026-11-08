/**
 * Stackra file contract:
 * Purpose: unit tests of `frameAncestorOrigin`: `self` prints `'self'`, an https origin (and http on localhost)
 *          prints as itself, and anything that is not exactly one origin throws.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0334 rule 12.
 */
import { describe, expect, it } from "@stackra/testing";

import { frameAncestorOrigin } from "#core/functions/frame-ancestor-origin.function";

describe("frameAncestorOrigin", () => {
  it.each([
    ["self", "'self'"],
    ["https://console.pay.example", "https://console.pay.example"],
    ["https://shop.example:8443", "https://shop.example:8443"],
    ["http://localhost:3000", "http://localhost:3000"],
    ["http://127.0.0.1:5173", "http://127.0.0.1:5173"],
  ])("prints %j as %j", (source, printed) => {
    expect(frameAncestorOrigin(source)).toBe(printed);
  });

  it.each([
    ["*"],
    ["https://*.shop.example"],
    ["https://Shop.example"],
    ["https://shop.example:443"],
    ["http://shop.example"],
    ["https://shop.example/c"],
    ["data:"],
  ])("refuses %j", (source) => {
    expect(() => frameAncestorOrigin(source)).toThrow(TypeError);
  });
});

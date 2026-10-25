/**
 * Stackra file contract:
 * Purpose: unit tests of `fillPath`: named params encoded, a splat kept with its slashes, an optional param dropped, a
 *          missing required one refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16).
 */
import { describe, expect, it } from "vitest";

import { fillPath } from "#core/functions/fill-path.function";

describe("fillPath", () => {
  it("fills named params, encoded", () => {
    expect(fillPath("/store/:slug", { slug: "tee shirt" })).toBe("/store/tee%20shirt");
    expect(fillPath("/orders/:orderId", { orderId: 42 })).toBe("/orders/42");
  });

  it("fills a splat with its slashes", () => {
    expect(fillPath("*", { "*": "help/billing" })).toBe("/help/billing");
    expect(fillPath("/m/*", {})).toBe("/m");
  });

  it("drops a missing optional param and refuses a missing required one", () => {
    expect(fillPath("/orders/:orderId?", {})).toBe("/orders");
    expect(() => fillPath("/store/:slug", {})).toThrow(/needs the param "slug"/);
  });

  it("keeps the root", () => {
    expect(fillPath("/")).toBe("/");
  });
});

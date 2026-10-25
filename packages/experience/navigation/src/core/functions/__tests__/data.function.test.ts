/**
 * Stackra file contract:
 * Purpose: unit tests of `data` and `isRouteResponse`: the status defaults to 200, headers are kept, the brand is
 *          non-enumerable (a test compares plain data), a bad status is refused, and plain objects are not responses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16).
 */
import { describe, expect, it } from "vitest";

import { data } from "#core/functions/data.function";
import { isRouteResponse } from "#core/functions/is-route-response.function";

describe("data", () => {
  it("wraps a value with a status and headers", () => {
    const response = data(
      { code: "site_not_found" },
      { status: 404, headers: { "X-Reason": "host" } },
    );
    expect(response).toEqual({
      data: { code: "site_not_found" },
      status: 404,
      headers: { "X-Reason": "host" },
    });
    expect(Object.isFrozen(response)).toBe(true);
  });

  it("defaults to 200 with no headers", () => {
    expect(data({ sent: true })).toEqual({ data: { sent: true }, status: 200, headers: {} });
  });

  it("refuses a status that is not an HTTP status", () => {
    expect(() => data(null, { status: 42 })).toThrow(RangeError);
  });
});

describe("isRouteResponse", () => {
  it("tells a route response from plain data", () => {
    expect(isRouteResponse(data(1))).toBe(true);
    expect(isRouteResponse({ data: 1, status: 200, headers: {} })).toBe(false);
    expect(isRouteResponse(null)).toBe(false);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `matchesEndpoint`: the method must match, the path matches as a suffix under any API prefix,
 *          a `:param` matches exactly one segment, and a longer path is not a call of a shorter endpoint.
 * Boundary: test only; the calls are written by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import type { ApiCall } from "#e2e/api-calls/api-call.type";
import { matchesEndpoint } from "#e2e/api-calls/matches-endpoint.function";

/** A call of `method` to `url`. */
const call = (method: string, url: string): ApiCall => ({ method, url, headers: {} });

describe(matchesEndpoint, () => {
  it("matches the method and the path under an API prefix", () => {
    const endpoint = { method: "POST", path: "/orders" };
    expect(matchesEndpoint(call("POST", "http://localhost/api/console/orders"), endpoint)).toBe(
      true,
    );
    expect(matchesEndpoint(call("post", "http://localhost/orders/"), endpoint)).toBe(true);
    expect(matchesEndpoint(call("GET", "http://localhost/orders"), endpoint)).toBe(false);
  });

  it("matches one segment per param and never a longer path", () => {
    const endpoint = { method: "PUT", path: "/orders/:orderId/cancel" };
    expect(matchesEndpoint(call("PUT", "http://localhost/orders/ord_1/cancel?x=1"), endpoint)).toBe(
      true,
    );
    expect(matchesEndpoint(call("PUT", "http://localhost/orders/a/b/cancel"), endpoint)).toBe(
      false,
    );
    expect(
      matchesEndpoint(call("POST", "http://localhost/orders/ord_1/lines"), {
        method: "POST",
        path: "/orders",
      }),
    ).toBe(false);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `apiCacheControl` (ADR 0325 rule 22): `private, no-store` for a request with an
 *          `Authorization` header or a cookie, and for an answer that sets a cookie, whatever the handler set;
 *          `undefined` for an anonymous request whose answer sets no cookie.
 * Boundary: test only; plain Fetch `Request` and `Response` objects.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0325 (rule 22); STA-1448.
 */
import { describe, expect, it } from "@stackra/testing";

import { apiCacheControl } from "#server/functions/api-cache-control.function";

const ENDPOINT = "https://api.example.test/orders";

describe(apiCacheControl, () => {
  it("forces private, no-store on a request signed in by bearer token", () => {
    const request = new Request(ENDPOINT, { headers: { authorization: "Bearer t" } });
    expect(apiCacheControl(request, new Response("{}"))).toBe("private, no-store");
  });

  it("forces private, no-store on a request that carries a cookie", () => {
    const request = new Request(ENDPOINT, { headers: { cookie: "session=s" } });
    expect(apiCacheControl(request, new Response("{}"))).toBe("private, no-store");
  });

  it("forces private, no-store on an answer that sets a cookie, even when the handler made it public", () => {
    const response = new Response("{}", {
      headers: { "set-cookie": "session=s; HttpOnly", "cache-control": "public, max-age=60" },
    });
    expect(apiCacheControl(new Request(ENDPOINT), response)).toBe("private, no-store");
  });

  it("forces nothing on an anonymous request whose answer sets no cookie", () => {
    const response = new Response("{}", { headers: { "cache-control": "public, max-age=60" } });
    expect(apiCacheControl(new Request(ENDPOINT), response)).toBeUndefined();
  });
});

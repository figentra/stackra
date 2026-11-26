/**
 * Stackra file contract:
 * Purpose: unit tests of the probe response helpers: `probeResponse` answers JSON that is never cached and drops the
 *          body for `HEAD`; `isProbeMethod` admits `GET` and `HEAD` only; `methodNotAllowed` is a 405 naming the
 *          allowed methods.
 * Boundary: test only; pure functions over Fetch `Request` and `Response`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190 (health).
 */
import { describe, expect, it } from "@stackra/testing";

import { isProbeMethod } from "#modules/health/functions/is-probe-method.function";
import { methodNotAllowed } from "#modules/health/functions/method-not-allowed.function";
import { probeResponse } from "#modules/health/functions/probe-response.function";

const url = "http://service.test/readyz";

/** The probe response helpers. */
describe("probe responses", () => {
  /** A GET gets the JSON body, the status and no caching. */
  it("answers a GET with the JSON body, the status and no caching", async () => {
    const response = probeResponse(new Request(url), 503, { database: "down", cache: "up" });
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ database: "down", cache: "up" });
  });

  /** A HEAD gets the same status and headers and no body. */
  it("answers a HEAD with the status and headers but no body", async () => {
    const response = probeResponse(new Request(url, { method: "HEAD" }), 200, { status: "up" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.text()).toBe("");
  });

  /** Only GET and HEAD are probe methods. */
  it("admits GET and HEAD and no other method", () => {
    const methods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
    expect(methods.filter((method) => isProbeMethod(new Request(url, { method })))).toEqual([
      "GET",
      "HEAD",
    ]);
  });

  /** The refusal says what is allowed. */
  it("answers any other method with 405 and the Allow header", async () => {
    const response = methodNotAllowed();
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "method_not_allowed" });
  });
});

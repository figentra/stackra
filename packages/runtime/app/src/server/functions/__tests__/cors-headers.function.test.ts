/**
 * Stackra file contract:
 * Purpose: unit tests of `corsHeaders`: an allowed origin is echoed with credentials, a preflight adds the methods,
 *          headers and max-age, credentials stay off when configured off, and a disallowed origin, a missing origin or
 *          a preflight for a method not allowed get only `Vary: Origin`.
 * Boundary: test only; configurations built with `buildConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { CorsConfig as BaseCorsConfig } from "#config/cors.config";
import { corsHeaders } from "#server/functions/cors-headers.function";

/** One allowed origin. */
class CorsConfig extends BaseCorsConfig {
  override allowedOrigins = ["https://app.acme.example"];
}

const config = buildConfig(CorsConfig);
const API_URL = "https://api.acme.example/orders";

/** A preflight from `origin` for `method`. */
const preflight = (origin: string, method: string) =>
  new Request(API_URL, {
    method: "OPTIONS",
    headers: { origin, "access-control-request-method": method },
  });

describe("corsHeaders", () => {
  it("echoes an allowed origin with credentials", () => {
    const headers = corsHeaders(
      new Request(API_URL, { headers: { origin: "https://app.acme.example" } }),
      config,
    );
    expect(headers.get("access-control-allow-origin")).toBe("https://app.acme.example");
    expect(headers.get("access-control-allow-credentials")).toBe("true");
    expect(headers.get("vary")).toBe("Origin");
    expect(headers.has("access-control-allow-methods")).toBe(false);
  });

  it("answers a preflight with the methods, headers and max-age", () => {
    const headers = corsHeaders(preflight("https://app.acme.example", "POST"), config);
    expect(headers.get("access-control-allow-methods")).toBe("GET, HEAD, POST, PUT, PATCH, DELETE");
    expect(headers.get("access-control-allow-headers")).toBe(
      "content-type, authorization, x-stackra-csrf",
    );
    expect(headers.get("access-control-max-age")).toBe("600");
  });

  it("leaves credentials off when configured off", () => {
    class NoCredentials extends CorsConfig {
      override allowCredentials = false;
    }
    const headers = corsHeaders(
      preflight("https://app.acme.example", "GET"),
      buildConfig(NoCredentials),
    );
    expect(headers.has("access-control-allow-credentials")).toBe(false);
  });

  it("gives a disallowed or missing origin only Vary", () => {
    for (const request of [
      new Request(API_URL, { headers: { origin: "https://evil.example" } }),
      new Request(API_URL),
    ]) {
      const headers = corsHeaders(request, config);
      expect([...headers.keys()]).toEqual(["vary"]);
    }
  });

  it("gives a preflight for a method not allowed only Vary", () => {
    const headers = corsHeaders(preflight("https://app.acme.example", "TRACE"), config);
    expect([...headers.keys()]).toEqual(["vary"]);
  });
});

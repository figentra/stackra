/**
 * Stackra file contract:
 * Purpose: unit tests of `OriginGuard`: it runs second (order -90); safe methods pass; a state-changing request
 *          passes from the API's own origin, an allowed origin, or an allowed referer, and with no origin and no
 *          cookie; it refuses another origin, the opaque `null` origin, and a cookie with no origin.
 * Boundary: test only; configurations built with `buildConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437 (decision 8); ADR 0457.
 */
import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CorsConfig as BaseCorsConfig } from "#config/cors.config";
import { CsrfConfig } from "#config/csrf.config";
import { OriginNotAllowedError } from "#server/errors/origin-not-allowed.error";
import { OriginGuard } from "#server/services/origin.guard";

/** One allowed app origin. */
class CorsConfig extends BaseCorsConfig {
  override allowedOrigins = ["https://app.acme.example"];
}

const guard = new OriginGuard(buildConfig(CorsConfig), buildConfig(CsrfConfig));

/** A request to the API with `headers`. */
const request = (method: string, headers: Record<string, string> = {}) =>
  new Request("https://api.acme.example/orders", { method, headers });

/** Whether checking `subject` refuses with `OriginNotAllowedError`. */
const refuses = (subject: Request) => {
  try {
    guard.check(subject);
    return false;
  } catch (error) {
    return isRefusal(error, OriginNotAllowedError);
  }
};

describe("OriginGuard", () => {
  it("runs after the edge headers", () => {
    expect(guard.order).toBe(-90);
  });

  it("lets safe methods through from anywhere", () => {
    expect(refuses(request("GET", { origin: "https://evil.example", cookie: "s=1" }))).toBe(false);
  });

  it("lets a state-changing request through from its own or an allowed origin", () => {
    expect(refuses(request("POST", { origin: "https://api.acme.example" }))).toBe(false);
    expect(refuses(request("POST", { origin: "https://app.acme.example" }))).toBe(false);
    expect(refuses(request("delete", { referer: "https://app.acme.example/orders/1" }))).toBe(
      false,
    );
  });

  it("lets a call with no origin and no cookie through", () => {
    expect(refuses(request("POST"))).toBe(false);
  });

  it("refuses another origin, the null origin, and a cookie with no origin", () => {
    expect(refuses(request("POST", { origin: "https://evil.example" }))).toBe(true);
    expect(refuses(request("PUT", { referer: "https://evil.example/x" }))).toBe(true);
    expect(refuses(request("POST", { origin: "null" }))).toBe(true);
    expect(refuses(request("PATCH", { cookie: "session=1" }))).toBe(true);
  });
});

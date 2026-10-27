/**
 * Stackra file contract:
 * Purpose: unit tests of `CsrfGuard`: it runs third (order -80); safe methods and cookieless calls pass; in
 *          custom-header mode a cookie-authenticated state-changing request needs a non-empty header; in
 *          double-submit mode the header must equal the token cookie, and a missing cookie or a mismatch is refused.
 * Boundary: test only; configurations built with `buildConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437 (decision 8); ADR 0457.
 */
import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { CsrfConfig } from "#config/csrf.config";
import { CsrfTokenInvalidError } from "#server/errors/csrf-token-invalid.error";
import { CsrfGuard } from "#server/services/csrf.guard";

/** Double-submit with the `__Host-csrf` cookie. */
class DoubleSubmitConfig extends CsrfConfig {
  override tokenCookie = "__Host-csrf";
}

/** A request to the API with `headers`. */
const request = (method: string, headers: Record<string, string> = {}) =>
  new Request("https://api.acme.example/orders", { method, headers });

/** Whether `guard` refuses `subject` with `CsrfTokenInvalidError`. */
const refuses = (guard: CsrfGuard, subject: Request) => {
  try {
    guard.check(subject);
    return false;
  } catch (error) {
    return isRefusal(error, CsrfTokenInvalidError);
  }
};

describe("CsrfGuard", () => {
  const header = new CsrfGuard(buildConfig(CsrfConfig));
  const double = new CsrfGuard(buildConfig(DoubleSubmitConfig));

  it("runs after the origin check", () => {
    expect(header.order).toBe(-80);
  });

  it("lets safe methods and cookieless calls through", () => {
    expect(refuses(header, request("GET", { cookie: "session=1" }))).toBe(false);
    expect(refuses(header, request("POST"))).toBe(false);
  });

  it("needs the header on a cookie-authenticated state-changing request", () => {
    expect(refuses(header, request("POST", { cookie: "session=1" }))).toBe(true);
    expect(refuses(header, request("POST", { cookie: "session=1", "x-stackra-csrf": "" }))).toBe(
      true,
    );
    expect(refuses(header, request("POST", { cookie: "session=1", "x-stackra-csrf": "1" }))).toBe(
      false,
    );
  });

  it("needs the header to repeat the token cookie in double-submit mode", () => {
    const cookie = "session=1; __Host-csrf=abc123";
    expect(refuses(double, request("PUT", { cookie, "x-stackra-csrf": "abc123" }))).toBe(false);
    expect(refuses(double, request("PUT", { cookie, "x-stackra-csrf": "abc124" }))).toBe(true);
    expect(refuses(double, request("PUT", { cookie, "x-stackra-csrf": "abc" }))).toBe(true);
    expect(
      refuses(double, request("PUT", { cookie: "session=1", "x-stackra-csrf": "abc123" })),
    ).toBe(true);
  });
});

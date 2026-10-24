/**
 * Stackra file contract:
 * Purpose: type tests of `Url`: an absolute URL or an app-scheme URL is accepted as a default, a relative path is
 *          refused.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import type { Url } from "#core/types/url.type";

describe("Url", () => {
  it("accepts an absolute URL and an app scheme", () => {
    const docs: Url = "https://docs.acme.example";
    const deepLink: Url = "acme://auth/callback";
    expect(new URL(docs).host).toBe("docs.acme.example");
    expect(new URL(deepLink).protocol).toBe("acme:");
  });

  it("refuses a relative path", () => {
    // @ts-expect-error -- a path is not an absolute URL
    const path: Url = "/orders";
    expect(path.startsWith("/")).toBe(true);
  });
});

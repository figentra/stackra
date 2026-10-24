/**
 * Stackra file contract:
 * Purpose: unit tests of `canonicalRedirect`: 301 with the canonical `Location` when the path or origin differs,
 *          `null` when already canonical, the query kept unless the canonical names one, the fragment dropped, a
 *          relative canonical resolved, and a URL that cannot be parsed refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { canonicalRedirect } from "#core/functions/canonical-redirect.function";

describe("canonicalRedirect", () => {
  it("answers a permanent redirect to a renamed product's slug", () => {
    const response = canonicalRedirect("https://acme.test/store/old-mug", "/store/blue-mug");
    expect(response?.status).toBe(301);
    expect(response?.headers.get("Location")).toBe("https://acme.test/store/blue-mug");
  });

  it("is null for a canonical request", () => {
    expect(
      canonicalRedirect("https://acme.test/store/blue-mug?utm=x", "/store/blue-mug"),
    ).toBeNull();
    expect(
      canonicalRedirect(new URL("https://acme.test/"), new URL("https://acme.test/")),
    ).toBeNull();
  });

  it("keeps the request's query unless the canonical names one", () => {
    expect(
      canonicalRedirect("https://acme.test/store/old?utm=x", "/store/new")?.headers.get("Location"),
    ).toBe("https://acme.test/store/new?utm=x");
    expect(
      canonicalRedirect("https://acme.test/store/old?utm=x", "/store/new?v=1")?.headers.get(
        "Location",
      ),
    ).toBe("https://acme.test/store/new?v=1");
  });

  it("redirects to the canonical origin", () => {
    const response = canonicalRedirect(
      "https://www.acme.test/pricing",
      "https://acme.test/pricing",
    );
    expect(response?.headers.get("Location")).toBe("https://acme.test/pricing");
  });

  it("drops the fragment", () => {
    expect(canonicalRedirect("https://acme.test/a", "/b#top")?.headers.get("Location")).toBe(
      "https://acme.test/b",
    );
  });

  it("refuses a request URL that cannot be parsed", () => {
    expect(() => canonicalRedirect("not a url", "/")).toThrow(TypeError);
  });
});

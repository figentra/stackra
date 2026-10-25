/**
 * Stackra file contract:
 * Purpose: proves `isAbsoluteUrl` is true for an address that starts with a scheme, in any case, and false for an
 *          app path, a relative path, a query or an empty string.
 * Boundary: pure function.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-026
import { isAbsoluteUrl } from "#core/functions/is-absolute-url.function";

describe("isAbsoluteUrl", () => {
  it.each(["https://example.com", "mailto:a@b.c", "tel:+20100", "HTTP://X", "my-app+beta://open"])(
    "%s is absolute",
    (href) => {
      expect(isAbsoluteUrl(href)).toBe(true);
    },
  );

  it.each(["/orders", "orders/1", "?page=2", "#top", "", "1http://x", "//cdn.example.com"])(
    "%s is a path",
    (href) => {
      expect(isAbsoluteUrl(href)).toBe(false);
    },
  );
});

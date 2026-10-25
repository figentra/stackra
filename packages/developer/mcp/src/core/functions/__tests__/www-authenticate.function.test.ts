/**
 * Stackra file contract:
 * Purpose: unit tests of `wwwAuthenticate`: the bare challenge, the error and scope added in order, and a value that
 *          cannot be quoted refused.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 2); RFC 9728 (section 5.1).
 */
import { describe, expect, it } from "@stackra/testing";

import { wwwAuthenticate } from "#core/functions/www-authenticate.function";

const METADATA = "https://mcp.example.test/.well-known/oauth-protected-resource";

describe("wwwAuthenticate", () => {
  it("names the metadata URL", () => {
    expect(wwwAuthenticate(METADATA)).toBe(`Bearer resource_metadata="${METADATA}"`);
  });

  it("adds the error and the scope", () => {
    expect(wwwAuthenticate(METADATA, { error: "insufficient_scope", scope: "mcp" })).toBe(
      `Bearer resource_metadata="${METADATA}", error="insufficient_scope", scope="mcp"`,
    );
  });

  it("refuses a value it cannot quote", () => {
    expect(() => wwwAuthenticate(METADATA, { scope: 'a"b' })).toThrow(RangeError);
  });
});

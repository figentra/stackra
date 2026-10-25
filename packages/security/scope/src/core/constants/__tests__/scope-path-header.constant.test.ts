/**
 * Stackra file contract:
 * Purpose: unit tests of `SCOPE_PATH_HEADER`: the one client header that asks for a scope is `X-Scope-Path`, a valid
 *          HTTP header name a `Headers` lookup finds case-insensitively.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 7); `.agents/rules/tenancy.md` (point 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { SCOPE_PATH_HEADER } from "#core/constants/scope-path-header.constant";

describe("SCOPE_PATH_HEADER", () => {
  it("is X-Scope-Path, found case-insensitively", () => {
    expect(SCOPE_PATH_HEADER).toBe("X-Scope-Path");
    const headers = new Headers({ "x-scope-path": "platform.acme" });
    expect(headers.get(SCOPE_PATH_HEADER)).toBe("platform.acme");
  });
});

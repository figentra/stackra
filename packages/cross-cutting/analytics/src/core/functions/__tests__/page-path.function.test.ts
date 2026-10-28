/**
 * Stackra file contract:
 * Purpose: unit tests of `pagePath`: query and hash removed, the path kept `/`-rooted.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; analytics gap 9 (stackra-409).
 */
import { describe, expect, it } from "@stackra/testing";

import { pagePath } from "#core/functions/page-path.function";

describe("pagePath", () => {
  it.each([
    ["/orders?page=2#top", "/orders"],
    ["/reset#token", "/reset"],
    ["/", "/"],
    ["", "/"],
    ["orders", "/orders"],
  ])("reads %j as %j", (input, path) => {
    expect(pagePath(input)).toBe(path);
  });
});

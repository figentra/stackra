/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./react` entry of @stackra/scope: the `useScope` hook only.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0327 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";
import { useScope } from "#react/scope/use-scope";

describe("@stackra/scope/react", () => {
  it("exports exactly the hook", () => {
    expect(Object.keys(react)).toEqual(["useScope"]);
    expect(react.useScope).toBe(useScope);
  });
});

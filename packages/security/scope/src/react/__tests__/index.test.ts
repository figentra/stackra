/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./react` entry of @stackra/scope: the `useScope` hook and the scope kit's
 *          `ScopePicker`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0327 (decision 10); ADR 0504.
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";
import { useScope } from "#react/scope/use-scope";
import { ScopePicker } from "#react/scope-picker/scope-picker";

describe("@stackra/scope/react", () => {
  it("exports exactly the hook and the kit", () => {
    expect(Object.keys(react).sort()).toEqual(["ScopePicker", "useScope"]);
    expect(react.ScopePicker).toBe(ScopePicker);
    expect(react.useScope).toBe(useScope);
  });
});

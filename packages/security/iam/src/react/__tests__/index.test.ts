/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `usePermission`, which the template's generated navigation
 *          imports, is its only export.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/iam/react", () => {
  it("exports exactly usePermission", () => {
    expect(Object.keys(react)).toEqual(["usePermission"]);
  });
});

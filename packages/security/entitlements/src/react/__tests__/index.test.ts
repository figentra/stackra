/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the entitlements kit's `EntitlementGate` is its only export.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0504.
 */
import { describe, expect, it } from "@stackra/testing";

import { EntitlementGate } from "#react/entitlement-gate/entitlement-gate";
import * as react from "#react/index";

describe("@stackra/entitlements/react", () => {
  it("exports exactly the kit", () => {
    expect(Object.keys(react)).toEqual(["EntitlementGate"]);
    expect(react.EntitlementGate).toBe(EntitlementGate);
  });
});

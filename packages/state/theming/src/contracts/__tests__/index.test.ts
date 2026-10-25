/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./contracts` entry of @stackra/theming: the `SystemColorScheme` port only.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import { SystemColorScheme } from "#contracts/ports/system-color-scheme.port";

describe("@stackra/theming/contracts", () => {
  it("exports exactly the port", () => {
    expect(Object.keys(contracts).sort()).toEqual(["SystemColorScheme"]);
    expect(contracts.SystemColorScheme).toBe(SystemColorScheme);
  });
});

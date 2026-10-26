/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports exactly the `EntitlementSource`,
 *          `EntitlementUsage`, `PlanSnapshots` and `SeatLedger` ports.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/entitlements/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "CatalogueVersionState",
      "CatalogueVersions",
      "EntitlementSource",
      "EntitlementUsage",
      "PlanSnapshots",
      "SeatLedger",
    ]);
  });
});

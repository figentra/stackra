/**
 * Stackra file contract:
 * Purpose: unit tests of `ScanVerdict`: its codes are the stored contract.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0222.
 */
import { describe, expect, it } from "@stackra/testing";

import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";

describe("ScanVerdict", () => {
  it("names the four verdicts", () => {
    expect([
      ScanVerdict.Clean,
      ScanVerdict.Infected,
      ScanVerdict.Pending,
      ScanVerdict.Failed,
    ]).toEqual(["clean", "infected", "pending", "failed"]);
  });
});

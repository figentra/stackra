/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalRecordStatus`: exactly its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";

describe("FiscalRecordStatus", () => {
  it("has exactly its codes", () => {
    expect(Enum.values(FiscalRecordStatus)).toEqual([
      "sealed",
      "submitted",
      "accepted",
      "rejected",
    ]);
  });
});

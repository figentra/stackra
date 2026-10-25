/**
 * Stackra file contract:
 * Purpose: unit tests of `fiscalRecord`: the first sealed record of a unit, with overrides.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { fiscalRecord } from "#testing/fiscal-record.fixture";

describe("fiscalRecord", () => {
  it("is the first sealed record and takes overrides", () => {
    expect(fiscalRecord()).toMatchObject({
      sequence: 1,
      previousHash: null,
      status: FiscalRecordStatus.Sealed,
    });
    expect(fiscalRecord({ sequence: 2 }).sequence).toBe(2);
  });
});

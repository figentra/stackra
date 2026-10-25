/**
 * Stackra file contract:
 * Purpose: unit tests of `TransferStatus`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TransferStatus } from "#contracts/enums/transfer-status.enum";

describe("TransferStatus", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(TransferStatus)).toEqual(["pending", "succeeded", "failed"]);
  });
});

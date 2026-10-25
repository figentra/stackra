/**
 * Stackra file contract:
 * Purpose: unit tests of `GetBalanceInput`: a registered shape of one `lac_` account id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { GetBalanceInput } from "#node/schemas/get-balance-input.schema";

describe("GetBalanceInput", () => {
  it("takes a lac_ account id only", () => {
    const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;
    expect(GetBalanceInput.create({ accountId }).accountId).toBe(accountId);
    expect(() => GetBalanceInput.create({ accountId: "ord_1" as PublicId<"lac"> })).toThrow();
  });
});

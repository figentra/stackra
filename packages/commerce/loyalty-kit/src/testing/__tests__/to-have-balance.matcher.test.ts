/**
 * Stackra file contract:
 * Purpose: unit tests of `toHaveBalance`: it passes on the ledger's balance and fails with a message that names the
 *          number it found.
 * Boundary: test only; on the memory driver, constructed directly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { memberId } from "#core/functions/member-id.function";
import { pointsEntry } from "#testing/points-entry.fixture";
import { toHaveBalance } from "#testing/to-have-balance.matcher";

describe("toHaveBalance", () => {
  it("compares the ledger balance and names the actual number on failure", async () => {
    expect(toHaveBalance.name).toBe("toHaveBalance");
    const ledger = new MemoryLoyaltyLedgerDriver();
    await ledger.append(pointsEntry.build({ points: 40 }));

    await expect(ledger).toHaveBalance(memberId("usr_1"), 40);
    await expect(expect(ledger).toHaveBalance(memberId("usr_1"), 41)).rejects.toThrow("found 40");
  });
});

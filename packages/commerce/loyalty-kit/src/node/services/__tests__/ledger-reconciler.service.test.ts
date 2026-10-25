/**
 * Stackra file contract:
 * Purpose: unit tests of `LedgerReconcilerService`: the drift is the current ledger's balance minus the primary's, zero
 *          when they agree.
 * Boundary: test only; two memory ledgers stand in for the named and the default instance.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 17).
 */
import type { Named } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { MemoryLoyaltyLedgerDriver } from "#core/drivers/memory-loyalty-ledger.driver";
import { memberId } from "#core/functions/member-id.function";
import { LedgerReconcilerService } from "#node/services/ledger-reconciler.service";
import { pointsEntry } from "#testing/points-entry.fixture";

describe("LedgerReconcilerService", () => {
  it("reports the current balance minus the primary's", async () => {
    const usr1 = memberId("usr_1");
    const primary = new MemoryLoyaltyLedgerDriver();
    const current = new MemoryLoyaltyLedgerDriver();
    const reconciler = new LedgerReconcilerService(
      primary as unknown as Named<LoyaltyLedger, "primary">,
      current,
    );
    await primary.append(pointsEntry.build({ memberId: usr1, points: 100 }));
    await current.append(pointsEntry.build({ memberId: usr1, points: 100 }));

    expect(await reconciler.drift(usr1)).toBe(0);
    await current.append(pointsEntry.build({ memberId: usr1, points: 20, reference: "ord_x" }));
    expect(await reconciler.drift(usr1)).toBe(20);
  });
});

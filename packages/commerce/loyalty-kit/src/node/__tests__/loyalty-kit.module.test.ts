/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyKitModule`: a module whose exports are `LoyaltyService`, `AccountService` and
 *          `LedgerReconcilerService`.
 * Boundary: test only; reads the module's recorded options. The binding of the ledger by config and the unresolved
 *           `LoyaltyMembers` port are gen's wiring and run with it (STA-339).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 12 and 16).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyService } from "#core/services/loyalty.service";
import { LoyaltyKitModule } from "#node/loyalty-kit.module";
import { AccountService } from "#node/services/account.service";
import { LedgerReconcilerService } from "#node/services/ledger-reconciler.service";

describe("LoyaltyKitModule", () => {
  it("is a module that exports the three services hosts inject", () => {
    expect(kindOf(LoyaltyKitModule)?.kind).toBe("module");
    expect(kindOf(LoyaltyKitModule)?.options["exports"]).toEqual([
      LoyaltyService,
      AccountService,
      LedgerReconcilerService,
    ]);
  });
});

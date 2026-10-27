/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentsModule`: a module whose exports are `PaymentService`, `RestrictedTenderService` and
 *          `PaymentBalanceService`.
 * Boundary: test only; reads the module's recorded options. The driver bindings are gen's wiring (STA-339).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 12 and 16).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { PaymentBalanceService } from "#core/services/payment-balance.service";
import { PaymentService } from "#core/services/payment.service";
import { RestrictedTenderService } from "#core/services/restricted-tender.service";
import { PaymentsModule } from "#node/payments.module";

describe("PaymentsModule", () => {
  it("is a module that exports the three services hosts inject", () => {
    expect(kindOf(PaymentsModule)?.kind).toBe("module");
    expect(kindOf(PaymentsModule)?.options["exports"]).toEqual([
      PaymentService,
      RestrictedTenderService,
      PaymentBalanceService,
    ]);
  });
});

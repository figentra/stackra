/**
 * Stackra file contract:
 * Purpose: `NoneConnectedAccountLimitsDriver`, the `none` driver of `ConnectedAccountLimits`, for a product with no
 *          connected accounts: it fails closed, refusing every question with `ConnectedAccountLimitsMissingError`.
 * Boundary: holds nothing and calls nothing. `PaymentService` asks only for a `connected-account` connection, so a
 *           product without one never reaches it; a product that enables connected-account payments or payouts with
 *           this driver bound is refused at the first one instead of running uncapped and unheld (owner decision
 *           2026-10-31: such a product binds the stored-limits `postgres` driver or a vendor one).
 * Runtime: isomorphic
 * Governing contract: R4-6; M3-2; STA-1707.
 */
import { Driver } from "@stackra/container";
import type { Money } from "@stackra/money";

import { ConnectedAccountLimits } from "#contracts/ports/connected-account-limits.port";
import { ConnectedAccountLimitsMissingError } from "#core/errors/connected-account-limits-missing.error";

/**
 * No connected accounts.
 *
 * @example
 * await new NoneConnectedAccountLimitsDriver().cap("conn_1"); // throws ConnectedAccountLimitsMissingError
 */
export class NoneConnectedAccountLimitsDriver extends Driver(ConnectedAccountLimits) {
  /**
   * Never answers.
   *
   * @throws ConnectedAccountLimitsMissingError always.
   */
  async cap(connectionId: string): Promise<Money | null> {
    throw ConnectedAccountLimitsMissingError.create({ connectionId });
  }

  /**
   * Never answers.
   *
   * @throws ConnectedAccountLimitsMissingError always.
   */
  async payoutHeld(connectionId: string): Promise<boolean> {
    throw ConnectedAccountLimitsMissingError.create({ connectionId });
  }
}

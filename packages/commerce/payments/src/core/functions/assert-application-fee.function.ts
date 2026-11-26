/**
 * Stackra file contract:
 * Purpose: `assertApplicationFee`, the check of a direct-charge `applicationFee` before it reaches a gateway: the
 *          payment's currency, not negative, no more than the amount it is taken from, and never beside a destination
 *          `platform` share (a direct charge and a destination charge are different flows).
 * Boundary: pure; no fee passes. The gateway decides whether its connection takes a fee at all (Stripe: a connected
 *           account's direct charge sends `application_fee_amount`).
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */
import type { Money } from "@stackra/money";

import { ApplicationFeeInvalidError } from "#core/errors/application-fee-invalid.error";

/**
 * Refuses a fee that cannot be taken from `amount`.
 *
 * @throws ApplicationFeeInvalidError naming the reason.
 * @example
 * assertApplicationFee("inv_7", Money.of("100.00", "SAR"), Money.of("2.50", "SAR"));
 */
export function assertApplicationFee(
  reference: string,
  amount: Money,
  fee: Money | undefined,
  withPlatform = false,
): void {
  if (fee === undefined) return;
  const reason = withPlatform
    ? "with_platform"
    : fee.currency !== amount.currency
      ? "currency"
      : fee.minor < 0
        ? "negative"
        : fee.minor > amount.minor
          ? "above_amount"
          : undefined;
  if (reason !== undefined) throw ApplicationFeeInvalidError.create({ reference, reason });
}

/**
 * Stackra file contract:
 * Purpose: `computePartnerPayout(gross, schedule)`, the fee and net of one period's gross under a fee schedule:
 *          the rate in basis points, rounded half up to a whole minor unit, plus the fixed fee, never more than the
 *          gross.
 * Boundary: pure, integer arithmetic in BigInt so no amount loses precision. The rate and fixed fee are the schedule's
 *           data; the rounding (half up, at the minor unit) is this mechanism's. The amounts are `MoneyAmount`s in the
 *           gross's currency.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8); config-model section 2 (`fee-schedule:<name>`); STA-1383 (MoneyAmount).
 */
import type { MoneyAmount } from "@stackra/money/contracts";

import type { FeeSchedule } from "#core/schemas/fee-schedule.schema";
import type { PayoutAmounts } from "#core/types/payout-amounts.type";

/**
 * The payout of `gross` under `schedule`.
 *
 * @throws RangeError when the gross is not a whole number at or above zero, or the schedule's rate or fixed fee is
 *         out of range.
 * @example
 * computePartnerPayout({ minor: 10_005, currency: "SAR" }, { basisPoints: 2_000, fixedMinor: 0 }); // fee 2_001, net 8_004
 */
export function computePartnerPayout(
  gross: MoneyAmount,
  schedule: Pick<FeeSchedule, "basisPoints" | "fixedMinor">,
): PayoutAmounts {
  const grossMinor = gross.minor;
  if (!Number.isSafeInteger(grossMinor) || grossMinor < 0)
    throw new RangeError(
      `computePartnerPayout: the gross is a whole number of minor units, got ${grossMinor}`,
    );
  const { basisPoints, fixedMinor } = schedule;
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000)
    throw new RangeError(
      `computePartnerPayout: a rate is 0 to 10,000 basis points, got ${basisPoints}`,
    );
  if (!Number.isSafeInteger(fixedMinor) || fixedMinor < 0)
    throw new RangeError(
      `computePartnerPayout: a fixed fee is a whole number of minor units, got ${fixedMinor}`,
    );
  const rated = (BigInt(grossMinor) * BigInt(basisPoints) + 5000n) / 10_000n;
  const fee = rated + BigInt(fixedMinor);
  const feeMinor = Number(fee > BigInt(grossMinor) ? BigInt(grossMinor) : fee);
  const { currency } = gross;
  return {
    gross,
    fee: { minor: feeMinor, currency },
    net: { minor: grossMinor - feeMinor, currency },
  };
}

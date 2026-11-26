/**
 * Stackra file contract:
 * Purpose: `consumerGatePinAge(pinned, today)`, the `ConsumerGatePin` of a matrix entry on the run date: an undated
 *          pin is stale; a dated one is stale past `CONSUMER_GATE_STALE_PIN_DAYS`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813 (open question 6); STA-2705.
 */
import { CONSUMER_GATE_STALE_PIN_DAYS } from "#node/consumer-gate/constants/consumer-gate-stale-pin-days.constant";
import type { ConsumerGatePin } from "#node/consumer-gate/types/consumer-gate-pin.type";

/** One day in milliseconds. */
const DAY = 86_400_000;

/**
 * The pin's age.
 *
 * @param pinned - the matrix `pinned` date, `YYYY-MM-DD`, or `undefined`.
 * @param today - the run date, `YYYY-MM-DD`.
 * @example
 * consumerGatePinAge("2026-11-01", "2026-11-26"); // { pinned: "2026-11-01", ageDays: 25, stale: true }
 */
export function consumerGatePinAge(pinned: string | undefined, today: string): ConsumerGatePin {
  if (pinned === undefined) return { stale: true };
  const ageDays = Math.round((Date.parse(today) - Date.parse(pinned)) / DAY);
  return { pinned, ageDays, stale: ageDays > CONSUMER_GATE_STALE_PIN_DAYS };
}

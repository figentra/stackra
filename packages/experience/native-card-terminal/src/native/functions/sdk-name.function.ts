/**
 * Stackra file contract:
 * Purpose: `sdkName`, which reads an SDK enum name the same way on both platforms: the iOS case name (`waitingForInput`)
 *          and the Android enum name (`WAITING_FOR_INPUT`) both become `waiting_for_input`, as Stripe's API spells it.
 * Boundary: internal; pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decision 1: the module maps nothing, the drivers read its answers); ADR 0231 (snake_case
 *                     machine codes).
 */

/**
 * The snake_case form of `raw`.
 *
 * @example
 * sdkName("requiresCapture"); // "requires_capture"
 * sdkName("TAP_TO_PAY_DEVICE"); // "tap_to_pay_device"
 */
export function sdkName(raw: string): string {
  return raw
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replaceAll(/[\s-]+/g, "_")
    .toLowerCase();
}

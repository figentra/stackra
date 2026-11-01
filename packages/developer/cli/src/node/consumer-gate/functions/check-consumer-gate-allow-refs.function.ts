/**
 * Stackra file contract:
 * Purpose: `checkConsumerGateAllowRefs(entries, products)`, one problem line for each allow entry that names a
 *          product the matrix lacks or a step `CONSUMER_GATE_STEPS` does not know (`test:int/billing` is `test:int`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { CONSUMER_GATE_STEPS } from "#node/consumer-gate/constants/consumer-gate-steps.constant";
import type { ConsumerGateAllowEntry } from "#node/consumer-gate/types/consumer-gate-allow-entry.type";

/**
 * Finds entries that can never apply.
 *
 * @param entries - the well-formed allow entries.
 * @param products - the matrix product names.
 * @example
 * checkConsumerGateAllowRefs(entries, ["billing"]); // ["allow entry STA-1: unknown product pay"]
 */
export function checkConsumerGateAllowRefs(
  entries: readonly ConsumerGateAllowEntry[],
  products: readonly string[],
): string[] {
  return entries.flatMap((entry) => [
    ...(products.includes(entry.product)
      ? []
      : [`allow entry ${entry.issue}: unknown product ${entry.product}`]),
    ...(CONSUMER_GATE_STEPS.includes(entry.step.split("/")[0] as string)
      ? []
      : [`allow entry ${entry.issue}: unknown step ${entry.step}`]),
  ]);
}

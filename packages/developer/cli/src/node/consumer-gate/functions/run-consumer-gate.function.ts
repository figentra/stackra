/**
 * Stackra file contract:
 * Purpose: `runConsumerGate(options, deps)`, the gate for one product (see `executeConsumerGate`), resolving with exit
 *          code 0 (every step passed or is excused), 1 (a blocking failure or a malformed allow entry) or 2 (a setup
 *          error: unknown product or service, unbuilt core, checkout not at the pin, missing overlays, a refused
 *          allow-list, an `--out` inside a tree, a failed copy or scratch-git command, an empty plan).
 * Boundary: writes only under `options.out`; any error thrown by setup or a file operation is returned as code 2 with
 *           its message, never thrown.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484; ADR 0166; spec `.agents/specs/sta-1813-product-gate`.
 */
import { executeConsumerGate } from "#node/consumer-gate/functions/execute-consumer-gate.function";
import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";
import type { ConsumerGateOptions } from "#node/consumer-gate/types/consumer-gate-options.type";
import type { ConsumerGateRun } from "#node/consumer-gate/types/consumer-gate-run.type";

/**
 * Runs the gate.
 *
 * @param options - the resolved paths, matrix, allow-list and flags.
 * @param deps - the process runner and `git rev-parse HEAD`.
 * @example
 * const { code } = runConsumerGate(options, createConsumerGateDeps());
 */
export function runConsumerGate(
  options: ConsumerGateOptions,
  deps: ConsumerGateDeps,
): ConsumerGateRun {
  try {
    return executeConsumerGate(options, deps);
  } catch (error) {
    return { code: 2, error: error instanceof Error ? error.message : String(error) };
  }
}

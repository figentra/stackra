/**
 * Stackra file contract:
 * Purpose: `buildConsumerGateEnvironment(input)`, the `ConsumerGateEnvironment` of a run from values the runner
 *          has already read; it only normalises them (an empty pnpm output is `undefined`, the version is the first
 *          line, overlay hashes are sorted by service).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateEnvironment } from "#node/consumer-gate/types/consumer-gate-environment.type";

/**
 * Builds the record.
 *
 * @param input - the gathered values; `pnpmOutput` is the raw `pnpm --version` log.
 * @example
 * buildConsumerGateEnvironment({ ...values, pnpmOutput: "10.1.0\n" }).pnpm; // "10.1.0"
 */
export function buildConsumerGateEnvironment(
  input: Omit<ConsumerGateEnvironment, "pnpm"> & { readonly pnpmOutput: string | undefined },
): ConsumerGateEnvironment {
  const { pnpmOutput, overlays, ...rest } = input;
  const pnpm = pnpmOutput?.split("\n")[0]?.trim();
  return {
    ...rest,
    pnpm: pnpm === undefined || pnpm === "" ? undefined : pnpm,
    overlays: Object.fromEntries(
      Object.entries(overlays).toSorted(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

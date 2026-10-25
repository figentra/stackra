/**
 * Stackra file contract:
 * Purpose: `DryRunOutcome`, what a dry run says a step would do: run its block, be skipped by its condition, or park
 *          the run on its wait.
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3: publishing needs a dry run); ADR 0270 (decision 6); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** A step's dry-run outcome. */
export const DryRunOutcome = Enum.of({
  /** The step's condition holds (or it has none) and it calls its block. */
  Run: "run",
  /** The step's condition does not hold. */
  Skip: "skip",
  /** The step waits for a trigger block before it calls its block. */
  Wait: "wait",
});

/** One of the codes above. */
export type DryRunOutcome = Enum.Value<typeof DryRunOutcome>;

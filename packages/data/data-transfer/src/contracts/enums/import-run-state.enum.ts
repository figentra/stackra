/**
 * Stackra file contract:
 * Purpose: `ImportRunState`, where an import run is: running (or crashed while running), failed, finished or reverted.
 * Boundary: an `Enum.of` value plus the type of the same name. A failed or crashed run resumes; a finished run can be
 *           reverted once; a reverted run is closed.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 7 and 8); ADR 0294 (decision 16: the Enum row); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The states of an import run. */
export const ImportRunState = Enum.of({
  /** Opened and not settled; a crash leaves a run here, and it resumes. */
  Running: "running",
  /** A batch threw; it resumes after its cursor. */
  Failed: "failed",
  /** Every row was read. */
  Finished: "finished",
  /** Every batch was reverted. */
  Reverted: "reverted",
});

/** One of the codes above. */
export type ImportRunState = Enum.Value<typeof ImportRunState>;

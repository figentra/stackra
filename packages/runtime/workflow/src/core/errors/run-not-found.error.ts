/**
 * Stackra file contract:
 * Purpose: `RunNotFoundError`, the refusal `workflow.run.get` answers for a run that does not exist or that the caller
 *          may not see (another tenant's, or another person's), so the two cannot be told apart.
 * Boundary: a refusal of kind NotFound; its code `run_not_found` is derived from the class name.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (refusals); STA-2613.
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * No run the caller may see has this id.
 *
 * @example
 * throw RunNotFoundError.create({ runId });
 */
export class RunNotFoundError extends Refusal({ kind: ErrorKind.NotFound }) {
  /** The id asked for. */
  runId!: PublicId<"wfr">;
}

/**
 * Stackra file contract:
 * Purpose: `FiscalChainConflictError`, the refusal when two seals on one unit raced for the same chain position.
 * Boundary: a refusal (`Conflict`); code derived from the class name; the fields carry keys and numbers only, never a
 *           document's content or personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0364; ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { Int } from "@stackra/validation";

/**
 * Retryable: sealing again reads the new tail.
 *
 * @example
 * throw FiscalChainConflictError.create({ unitId: "till_1", sequence: 42 });
 */
export class FiscalChainConflictError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: true,
}) {
  /** The sequence both tried to take. */
  @Int({ min: 0 })
  sequence!: number;

  /** The unit whose chain was taken. */
  unitId!: string;
}

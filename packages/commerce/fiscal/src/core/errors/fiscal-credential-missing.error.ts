/**
 * Stackra file contract:
 * Purpose: `FiscalCredentialMissingError`, the refusal when a unit has no fiscal credential, or not the stage or field
 *          a driver needs.
 * Boundary: a refusal (`FailedPrecondition`); code derived from the class name; the fields carry keys and numbers only,
 *           never a
 *           document's content or personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0364; ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable until the unit is onboarded.
 *
 * @example
 * throw FiscalCredentialMissingError.create({ unitId: "till_1", driver: "rksv" });
 */
export class FiscalCredentialMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The unit without the credential. */
  unitId!: string;

  /** The driver that needs it. */
  driver!: string;
}

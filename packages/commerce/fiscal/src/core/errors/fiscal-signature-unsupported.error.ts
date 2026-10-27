/**
 * Stackra file contract:
 * Purpose: `FiscalSignatureUnsupportedError`, the refusal when a signer is asked for a signature format it does not
 *          make (the XAdES envelope signer asked for CAdES).
 * Boundary: a refusal (`FailedPrecondition`); code derived from the class name; the fields carry keys only, never a
 *           payload or key material.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0328
 *                     (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the host binds a signer that makes the format the driver asks for.
 *
 * @example
 * throw FiscalSignatureUnsupportedError.create({ unitId: "till_1", format: "cades" });
 */
export class FiscalSignatureUnsupportedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The unit whose signature was asked for. */
  unitId!: string;

  /** The format the signer does not make. */
  format!: string;
}

/**
 * Stackra file contract:
 * Purpose: `FiscalOptionsInvalidError`, the refusal when a market pack's options for a driver do not fit the driver's
 *          schema.
 * Boundary: a refusal (`FailedPrecondition`); code derived from the class name; the fields carry keys and numbers only,
 *           never a
 *           document's content or personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0364; ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { Str } from "@stackra/validation";

/**
 * Not retryable: the pack must be corrected and republished.
 *
 * @example
 * throw FiscalOptionsInvalidError.create({ driver: "peppol", issues: "accessPointUrl: Invalid URL" });
 */
export class FiscalOptionsInvalidError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The driver whose schema refused the options. */
  @Str()
  driver!: string;

  /** The schema issues as `path: message`, joined by "; ". */
  @Str()
  issues!: string;
}

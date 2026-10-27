/**
 * Stackra file contract:
 * Purpose: `FiscalOnboardingRefusedError`, the refusal when an authority answered a unit's credential request with a
 *          refusal (a wrong one-time password, a malformed CSR, an unknown compliance request).
 * Boundary: a refusal (`FailedPrecondition`); code derived from the class name; the fields are the unit and the HTTP
 *           status, never the OTP, the CSR or the authority's body.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0294 (decisions 16 and 20); ADR 0140; ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { Int } from "@stackra/validation";

/**
 * Not retryable with the same input: the operator asks for a new OTP or a new CSR.
 *
 * @example
 * throw FiscalOnboardingRefusedError.create({ unitId: "till_1", status: 400 });
 */
export class FiscalOnboardingRefusedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The authority's HTTP status. */
  @Int({ min: 0 })
  status!: number;

  /** The unit being onboarded. */
  unitId!: string;
}

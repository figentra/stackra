/**
 * Stackra file contract:
 * Purpose: `FiscalOnboardingUnsupportedError`, the refusal when a till mandate names a driver no registered
 *          `FiscalOnboarding` serves.
 * Boundary: a refusal (`FailedPrecondition`); code derived from the class name; the field is the driver key only.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0294 (decisions 16 and 20); ADR 0140; ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { Str } from "@stackra/validation";

/**
 * Not retryable until the host registers an onboarding for the driver or the pack changes.
 *
 * @example
 * throw FiscalOnboardingUnsupportedError.create({ driver: "nf525" });
 */
export class FiscalOnboardingUnsupportedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The driver key the till mandate names. */
  @Str()
  driver!: string;
}

/**
 * Stackra file contract:
 * Purpose: `FiscalOnboardingInputMissingError`, the refusal when a unit's registration answers lack an input its
 *          mandate's `FiscalOnboarding` lists.
 * Boundary: a refusal (`Validation`); code derived from the class name; the fields are the unit, the driver key
 *           and the input's code, never an answer's value.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0294 (decisions 16 and 20); ADR 0140; ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { Str } from "@stackra/validation";

/**
 * Not retryable with the same answers: the operator fills the named input.
 *
 * @example
 * throw FiscalOnboardingInputMissingError.create({ unitId: "till_1", driver: "eta", input: "client_id" });
 */
export class FiscalOnboardingInputMissingError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The unit being onboarded. */
  @Str()
  unitId!: string;

  /** The driver key of the onboarding. */
  @Str()
  driver!: string;

  /** The `OnboardingInput` code left empty. */
  @Str()
  input!: string;
}

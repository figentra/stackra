/**
 * Stackra file contract:
 * Purpose: `onboardingAnswers`, a unit's registration answers checked against the inputs its onboarding lists: the
 *          trust boundary between a pairing screen and the authority.
 * Boundary: a pure function; an input left out or blank is refused by its code, never filled from code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */
import type { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import { FiscalOnboardingInputMissingError } from "#core/errors/fiscal-onboarding-input-missing.error";

/**
 * Every listed input, trimmed.
 *
 * @example
 * const { otp, csr } = onboardingAnswers(answers, this.inputs, unitId, this.key);
 * @throws FiscalOnboardingInputMissingError naming the first input left out or blank.
 */
export function onboardingAnswers<I extends OnboardingInput>(
  answers: Readonly<Partial<Record<OnboardingInput, string>>>,
  inputs: readonly I[],
  unitId: string,
  driver: string,
): Record<I, string> {
  const values = {} as Record<I, string>;
  for (const input of inputs) {
    const value = answers[input]?.trim();
    if (!value) throw FiscalOnboardingInputMissingError.create({ unitId, driver, input });
    values[input] = value;
  }
  return values;
}
